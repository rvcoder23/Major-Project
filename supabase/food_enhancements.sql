-- =========================
-- FOOD COURT ENHANCEMENTS
-- =========================

-- 1. Update food_menu table to support plate types
ALTER TABLE food_menu 
ADD COLUMN half_plate_price DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN full_plate_price DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN supports_half_plate BOOLEAN DEFAULT FALSE;

-- 2. Update food_orders table to support room delivery
ALTER TABLE food_orders 
ADD COLUMN order_type VARCHAR(20) DEFAULT 'Restaurant' CHECK (order_type IN ('Restaurant', 'Room Service')),
ADD COLUMN room_number INTEGER DEFAULT NULL,
ADD COLUMN plate_type VARCHAR(20) DEFAULT 'Full' CHECK (plate_type IN ('Half', 'Full'));

-- 3. Update existing menu items to have both half and full plate prices
-- For items that support half plate, set the current price as full plate price
-- and calculate half plate price as 60% of full plate price
UPDATE food_menu 
SET 
    full_plate_price = price,
    half_plate_price = ROUND(price * 0.6, 2),
    supports_half_plate = TRUE
WHERE category IN ('Main Course', 'Rice', 'Bread');

-- 4. For items that don't support half plate (beverages, etc.), keep current price
UPDATE food_menu 
SET 
    full_plate_price = price,
    supports_half_plate = FALSE
WHERE category IN ('Beverage', 'Dessert');

-- 5. Add sample room service items
INSERT INTO food_menu (item_name, category, price, full_plate_price, half_plate_price, supports_half_plate) VALUES
('Room Service - Continental Breakfast', 'Room Service', 450.00, 450.00, NULL, FALSE),
('Room Service - Indian Breakfast', 'Room Service', 350.00, 350.00, 210.00, TRUE),
('Room Service - Lunch Thali', 'Room Service', 500.00, 500.00, 300.00, TRUE),
('Room Service - Dinner Thali', 'Room Service', 600.00, 600.00, 360.00, TRUE);

-- 6. Create index for better performance
CREATE INDEX idx_food_orders_order_type ON food_orders(order_type);
CREATE INDEX idx_food_orders_room_number ON food_orders(room_number);
CREATE INDEX idx_food_orders_plate_type ON food_orders(plate_type);
