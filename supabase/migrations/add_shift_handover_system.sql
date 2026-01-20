-- Shift Handover System Migration
-- Creates tables for shift management, staff tracking, and handover reports

-- 1. Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  shift_code VARCHAR(1) NOT NULL UNIQUE CHECK (shift_code IN ('M', 'A', 'E')),
  shift_name VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default shifts
INSERT INTO shifts (shift_code, shift_name, start_time, end_time) VALUES
('M', 'Morning', '06:00:00', '14:00:00'),
('A', 'Afternoon', '14:00:00', '22:00:00'),
('E', 'Evening', '22:00:00', '06:00:00')
ON CONFLICT (shift_code) DO NOTHING;

-- 2. Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  phone_number VARCHAR(15),
  email VARCHAR(255),
  role VARCHAR(50) NOT NULL,
  assigned_shift VARCHAR(1) REFERENCES shifts(shift_code),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_shift ON staff(assigned_shift);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(is_active);

-- 3. Create shift_handovers table
CREATE TABLE IF NOT EXISTS shift_handovers (
  id SERIAL PRIMARY KEY,
  handover_date DATE NOT NULL,
  outgoing_shift VARCHAR(1) NOT NULL REFERENCES shifts(shift_code),
  incoming_shift VARCHAR(1) NOT NULL REFERENCES shifts(shift_code),
  outgoing_staff_id INTEGER REFERENCES staff(id),
  incoming_staff_id INTEGER REFERENCES staff(id),
  
  -- Snapshot data at handover time
  total_reservations INTEGER DEFAULT 0,
  total_checkins INTEGER DEFAULT 0,
  total_checkouts INTEGER DEFAULT 0,
  total_cancellations INTEGER DEFAULT 0,
  total_noshows INTEGER DEFAULT 0,
  
  occupied_rooms INTEGER DEFAULT 0,
  reserved_rooms INTEGER DEFAULT 0,
  available_rooms INTEGER DEFAULT 0,
  cleaning_rooms INTEGER DEFAULT 0,
  maintenance_rooms INTEGER DEFAULT 0,
  
  pending_food_orders INTEGER DEFAULT 0,
  completed_food_orders INTEGER DEFAULT 0,
  
  total_revenue DECIMAL(10,2) DEFAULT 0,
  cash_payments DECIMAL(10,2) DEFAULT 0,
  card_payments DECIMAL(10,2) DEFAULT 0,
  upi_payments DECIMAL(10,2) DEFAULT 0,
  pending_payments INTEGER DEFAULT 0,
  
  -- Issues and notes
  pending_issues TEXT,
  special_notes TEXT,
  vip_guests TEXT,
  
  -- Handover status
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Acknowledged')),
  handover_time TIMESTAMP DEFAULT NOW(),
  acknowledged_time TIMESTAMP,
  acknowledged_by INTEGER REFERENCES staff(id),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shift_handovers_date ON shift_handovers(handover_date);
CREATE INDEX IF NOT EXISTS idx_shift_handovers_shift ON shift_handovers(outgoing_shift, incoming_shift);
CREATE INDEX IF NOT EXISTS idx_shift_handovers_status ON shift_handovers(status);

-- 4. Create shift_activities table
CREATE TABLE IF NOT EXISTS shift_activities (
  id SERIAL PRIMARY KEY,
  shift_date DATE NOT NULL,
  shift_code VARCHAR(1) NOT NULL REFERENCES shifts(shift_code),
  staff_id INTEGER REFERENCES staff(id),
  
  activity_type VARCHAR(50) NOT NULL,
  activity_description TEXT,
  reference_id INTEGER,
  reference_type VARCHAR(50), -- 'booking', 'food_order', 'payment', etc.
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for activity queries
CREATE INDEX IF NOT EXISTS idx_shift_activities_date_shift ON shift_activities(shift_date, shift_code);
CREATE INDEX IF NOT EXISTS idx_shift_activities_type ON shift_activities(activity_type);

-- 5. Add comments for documentation
COMMENT ON TABLE shifts IS 'Defines the three work shifts: Morning, Afternoon, Evening';
COMMENT ON TABLE staff IS 'Hotel staff members with shift assignments';
COMMENT ON TABLE shift_handovers IS 'Handover reports between shifts with complete snapshot data';
COMMENT ON TABLE shift_activities IS 'Detailed activity log for each shift';

COMMENT ON COLUMN shift_handovers.status IS 'Pending: Generated but not acknowledged, Completed: Acknowledged by incoming staff, Acknowledged: Same as Completed';
COMMENT ON COLUMN shift_handovers.outgoing_shift IS 'Shift that is ending and creating the handover';
COMMENT ON COLUMN shift_handovers.incoming_shift IS 'Shift that is starting and receiving the handover';

-- 6. Helper function to get current shift based on time
CREATE OR REPLACE FUNCTION get_current_shift()
RETURNS VARCHAR(1) AS $$
DECLARE
  current_time_val TIME := CURRENT_TIME;
  shift_code_val VARCHAR(1);
BEGIN
  -- Morning: 06:00 - 14:00
  IF current_time_val >= '06:00:00' AND current_time_val < '14:00:00' THEN
    shift_code_val := 'M';
  -- Afternoon: 14:00 - 22:00
  ELSIF current_time_val >= '14:00:00' AND current_time_val < '22:00:00' THEN
    shift_code_val := 'A';
  -- Evening: 22:00 - 06:00
  ELSE
    shift_code_val := 'E';
  END IF;
  
  RETURN shift_code_val;
END;
$$ LANGUAGE plpgsql;

-- 7. Helper function to get next shift
CREATE OR REPLACE FUNCTION get_next_shift(current_shift VARCHAR(1))
RETURNS VARCHAR(1) AS $$
BEGIN
  CASE current_shift
    WHEN 'M' THEN RETURN 'A';
    WHEN 'A' THEN RETURN 'E';
    WHEN 'E' THEN RETURN 'M';
    ELSE RETURN 'M';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger to update updated_at timestamp on staff table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON staff
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
