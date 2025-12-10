-- Add missing columns to food_orders table
ALTER TABLE food_orders 
ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) DEFAULT 'Restaurant',
ADD COLUMN IF NOT EXISTS room_number INTEGER,
ADD COLUMN IF NOT EXISTS plate_type VARCHAR(20) DEFAULT 'Full',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'Cash';

-- Add check constraint for order_type
ALTER TABLE food_orders 
ADD CONSTRAINT check_order_type 
CHECK (order_type IN ('Restaurant', 'Room Service'));
