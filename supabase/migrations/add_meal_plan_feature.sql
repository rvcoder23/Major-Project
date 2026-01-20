-- ========================================
-- MEAL PLAN FEATURE MIGRATION
-- ========================================
-- This migration adds meal plan functionality to the hotel management system
-- Includes: meal plan configuration, booking integration, entitlement tracking, and food order integration

-- 1. Create meal_plan_config table
-- Stores meal plan types and pricing
CREATE TABLE IF NOT EXISTS meal_plan_config (
  id SERIAL PRIMARY KEY,
  plan_type VARCHAR(10) UNIQUE NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  description TEXT,
  cost_per_person_per_day DECIMAL(10,2) NOT NULL DEFAULT 0,
  includes_breakfast BOOLEAN DEFAULT false,
  includes_lunch BOOLEAN DEFAULT false,
  includes_dinner BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert meal plan configurations (idempotent - won't fail if already exists)
INSERT INTO meal_plan_config (plan_type, plan_name, description, cost_per_person_per_day, includes_breakfast, includes_lunch, includes_dinner) VALUES
('EP', 'European Plan', 'Room Only - No meals included', 0, false, false, false),
('CP', 'Continental Plan', 'Room + Breakfast', 300, true, false, false),
('MAP', 'Modified American Plan', 'Room + Breakfast + One Meal (Lunch OR Dinner)', 700, true, true, true),
('AP', 'American Plan', 'Room + All Meals (Breakfast, Lunch, Dinner)', 1200, true, true, true)
ON CONFLICT (plan_type) DO NOTHING;

-- 2. Alter bookings table to add meal plan fields
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS meal_plan VARCHAR(10) DEFAULT 'EP',
ADD COLUMN IF NOT EXISTS number_of_guests INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS meal_plan_cost DECIMAL(10,2) DEFAULT 0;

-- Add foreign key constraint (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_bookings_meal_plan'
    ) THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT fk_bookings_meal_plan 
        FOREIGN KEY (meal_plan) REFERENCES meal_plan_config(plan_type);
    END IF;
END $$;

-- Update existing bookings to have default values
UPDATE bookings 
SET meal_plan = 'EP', 
    number_of_guests = 1, 
    meal_plan_cost = 0 
WHERE meal_plan IS NULL;

-- 3. Create meal_entitlements table
-- Tracks daily meal usage for guests with meal plans
CREATE TABLE IF NOT EXISTS meal_entitlements (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  guest_number INTEGER NOT NULL DEFAULT 1,
  entitlement_date DATE NOT NULL,
  breakfast_used BOOLEAN DEFAULT false,
  lunch_used BOOLEAN DEFAULT false,
  dinner_used BOOLEAN DEFAULT false,
  breakfast_used_at TIMESTAMP,
  lunch_used_at TIMESTAMP,
  dinner_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(booking_id, guest_number, entitlement_date)
);

-- 4. Alter food_orders table to add meal plan integration
ALTER TABLE food_orders 
ADD COLUMN IF NOT EXISTS booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS guest_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_meal_plan_included BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS meal_type VARCHAR(20);

-- Add check constraint for meal_type (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_meal_type'
    ) THEN
        ALTER TABLE food_orders 
        ADD CONSTRAINT chk_meal_type 
        CHECK (meal_type IS NULL OR meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack'));
    END IF;
END $$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_meal_plan ON bookings(meal_plan);
CREATE INDEX IF NOT EXISTS idx_meal_entitlements_booking ON meal_entitlements(booking_id);
CREATE INDEX IF NOT EXISTS idx_meal_entitlements_date ON meal_entitlements(entitlement_date);
CREATE INDEX IF NOT EXISTS idx_food_orders_booking ON food_orders(booking_id);
CREATE INDEX IF NOT EXISTS idx_food_orders_meal_plan ON food_orders(is_meal_plan_included);

-- 6. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meal_entitlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_meal_entitlements_updated_at ON meal_entitlements;
CREATE TRIGGER trigger_update_meal_entitlements_updated_at
BEFORE UPDATE ON meal_entitlements
FOR EACH ROW
EXECUTE FUNCTION update_meal_entitlements_updated_at();

-- 7. Create helper function to auto-generate meal entitlements for a booking
CREATE OR REPLACE FUNCTION generate_meal_entitlements(
  p_booking_id INTEGER,
  p_check_in DATE,
  p_check_out DATE,
  p_number_of_guests INTEGER
)
RETURNS void AS $$
DECLARE
  loop_date DATE;
  guest_num INTEGER;
BEGIN
  -- Loop through each date in the booking period
  loop_date := p_check_in;
  WHILE loop_date < p_check_out LOOP
    -- Loop through each guest
    FOR guest_num IN 1..p_number_of_guests LOOP
      -- Insert entitlement record for this guest and date
      INSERT INTO meal_entitlements (booking_id, guest_number, entitlement_date)
      VALUES (p_booking_id, guest_num, loop_date)
      ON CONFLICT (booking_id, guest_number, entitlement_date) DO NOTHING;
    END LOOP;
    
    loop_date := loop_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to check meal eligibility
CREATE OR REPLACE FUNCTION check_meal_eligibility(
  p_booking_id INTEGER,
  p_guest_number INTEGER,
  p_meal_type VARCHAR(20),
  p_date DATE
)
RETURNS TABLE(eligible BOOLEAN, reason TEXT) AS $$
DECLARE
  v_meal_plan VARCHAR(10);
  v_plan_config RECORD;
  v_entitlement RECORD;
  v_map_meal_used BOOLEAN;
BEGIN
  -- Get booking meal plan
  SELECT meal_plan INTO v_meal_plan FROM bookings WHERE id = p_booking_id;
  
  -- If no meal plan or EP, not eligible
  IF v_meal_plan IS NULL OR v_meal_plan = 'EP' THEN
    RETURN QUERY SELECT false, 'No meal plan or European Plan (Room Only)';
    RETURN;
  END IF;
  
  -- Get meal plan configuration
  SELECT * INTO v_plan_config FROM meal_plan_config WHERE plan_type = v_meal_plan;
  
  -- Check if meal type is included in plan
  IF p_meal_type = 'Breakfast' AND NOT v_plan_config.includes_breakfast THEN
    RETURN QUERY SELECT false, 'Breakfast not included in meal plan';
    RETURN;
  END IF;
  
  IF p_meal_type = 'Lunch' AND NOT v_plan_config.includes_lunch THEN
    RETURN QUERY SELECT false, 'Lunch not included in meal plan';
    RETURN;
  END IF;
  
  IF p_meal_type = 'Dinner' AND NOT v_plan_config.includes_dinner THEN
    RETURN QUERY SELECT false, 'Dinner not included in meal plan';
    RETURN;
  END IF;
  
  IF p_meal_type = 'Snack' THEN
    RETURN QUERY SELECT false, 'Snacks are never included in meal plans';
    RETURN;
  END IF;
  
  -- Get entitlement record
  SELECT * INTO v_entitlement 
  FROM meal_entitlements 
  WHERE booking_id = p_booking_id 
    AND guest_number = p_guest_number 
    AND entitlement_date = p_date;
  
  -- If no entitlement record exists, not eligible (date out of range)
  IF v_entitlement IS NULL THEN
    RETURN QUERY SELECT false, 'Date is outside booking period';
    RETURN;
  END IF;
  
  -- Check if meal already used
  IF p_meal_type = 'Breakfast' AND v_entitlement.breakfast_used THEN
    RETURN QUERY SELECT false, 'Breakfast already used for this date';
    RETURN;
  END IF;
  
  IF p_meal_type = 'Lunch' AND v_entitlement.lunch_used THEN
    RETURN QUERY SELECT false, 'Lunch already used for this date';
    RETURN;
  END IF;
  
  IF p_meal_type = 'Dinner' AND v_entitlement.dinner_used THEN
    RETURN QUERY SELECT false, 'Dinner already used for this date';
    RETURN;
  END IF;
  
  -- Special logic for MAP (Modified American Plan)
  -- MAP includes breakfast + ONE meal (lunch OR dinner, whichever is ordered first)
  IF v_meal_plan = 'MAP' AND (p_meal_type = 'Lunch' OR p_meal_type = 'Dinner') THEN
    -- Check if the other meal has already been used
    v_map_meal_used := (v_entitlement.lunch_used OR v_entitlement.dinner_used);
    
    IF v_map_meal_used THEN
      RETURN QUERY SELECT false, 'MAP plan allows only one meal (lunch OR dinner) per day. Already used.';
      RETURN;
    END IF;
  END IF;
  
  -- All checks passed, meal is eligible
  RETURN QUERY SELECT true, 'Meal is included in plan and available';
END;
$$ LANGUAGE plpgsql;

-- 9. Add comments for documentation
COMMENT ON TABLE meal_plan_config IS 'Configuration table for meal plan types and pricing';
COMMENT ON TABLE meal_entitlements IS 'Tracks daily meal usage for guests with meal plans';
COMMENT ON COLUMN bookings.meal_plan IS 'Meal plan type: EP (Room Only), CP (Breakfast), MAP (Breakfast + 1 Meal), AP (All Meals)';
COMMENT ON COLUMN bookings.number_of_guests IS 'Number of guests for meal plan calculation';
COMMENT ON COLUMN bookings.meal_plan_cost IS 'Total cost of meal plan for all guests for entire stay';
COMMENT ON COLUMN food_orders.booking_id IS 'Reference to booking if this is a room service order';
COMMENT ON COLUMN food_orders.guest_number IS 'Guest number within the booking (1, 2, 3, etc.)';
COMMENT ON COLUMN food_orders.is_meal_plan_included IS 'True if this meal was covered by guest meal plan';
COMMENT ON COLUMN food_orders.meal_type IS 'Type of meal: Breakfast, Lunch, Dinner, or Snack';

-- Migration complete
