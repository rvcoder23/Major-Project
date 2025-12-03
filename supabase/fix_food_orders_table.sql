-- Fix food_orders table schema
-- Add missing columns: customer_name and table_number

-- Add customer_name column
ALTER TABLE food_orders 
ADD COLUMN customer_name VARCHAR(100);

-- Add table_number column  
ALTER TABLE food_orders 
ADD COLUMN table_number INTEGER;

-- Update the table comment to reflect the changes
COMMENT ON TABLE food_orders IS 'Food orders table with customer and table information';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_food_orders_customer_name ON food_orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_food_orders_table_number ON food_orders(table_number);
CREATE INDEX IF NOT EXISTS idx_food_orders_status ON food_orders(status);
CREATE INDEX IF NOT EXISTS idx_food_orders_order_date ON food_orders(order_date);

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'food_orders' 
ORDER BY ordinal_position;
