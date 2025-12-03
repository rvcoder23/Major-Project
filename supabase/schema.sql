-- =========================
-- FRONT OFFICE MANAGEMENT DATABASE
-- =========================

-- 1. Rooms Table
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  room_number VARCHAR(10) UNIQUE NOT NULL,
  room_type VARCHAR(50) NOT NULL,
  rate_per_night DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'Available',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Bookings Table
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  guest_name VARCHAR(100) NOT NULL,
  room_id INTEGER REFERENCES rooms(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_amount DECIMAL(10,2),
  payment_status VARCHAR(20) DEFAULT 'Pending',
  booking_status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Housekeeping Table
CREATE TABLE housekeeping (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(id),
  staff_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Pending',
  cleaning_date DATE DEFAULT CURRENT_DATE
);

-- 4. Inventory Table
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  item_name VARCHAR(100) NOT NULL,
  quantity INTEGER DEFAULT 0,
  supplier_name VARCHAR(100),
  last_refilled DATE DEFAULT CURRENT_DATE,
  threshold INTEGER DEFAULT 5,
  price DECIMAL(10,2) DEFAULT 0
);

-- 5. Purchases Table
CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES inventory(id),
  quantity INTEGER NOT NULL,
  purchase_date DATE DEFAULT CURRENT_DATE,
  total_cost DECIMAL(10,2)
);

-- 6. Food Menu Table
CREATE TABLE food_menu (
  id SERIAL PRIMARY KEY,
  item_name VARCHAR(100),
  category VARCHAR(50),
  price DECIMAL(10,2)
);

-- 7. Food Orders Table
CREATE TABLE food_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  item_id INTEGER REFERENCES food_menu(id),
  quantity INTEGER,
  total_amount DECIMAL(10,2),
  customer_name VARCHAR(100),
  table_number INTEGER,
  order_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'Pending'
);

-- 8. Accounts Table
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  description TEXT,
  amount DECIMAL(10,2),
  type VARCHAR(20) CHECK (type IN ('Income', 'Expense')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Banquet Bookings Table
CREATE TABLE banquets (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(100),
  customer_name VARCHAR(100),
  date DATE,
  total_cost DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'Booked'
);

-- 10. Utilities Table
CREATE TABLE utilities (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50),
  usage_units DECIMAL(10,2),
  cost_per_unit DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  date DATE DEFAULT CURRENT_DATE
);

-- 11. Logs Table
CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(255),
  performed_by VARCHAR(100) DEFAULT 'admin',
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Insert sample data
INSERT INTO rooms (room_number, room_type, rate_per_night, status, description) VALUES
('101', 'Deluxe', 2500.00, 'Available', 'Spacious room with city view'),
('102', 'Standard', 1800.00, 'Available', 'Comfortable standard room'),
('103', 'Suite', 4500.00, 'Available', 'Luxury suite with balcony'),
('104', 'Deluxe', 2500.00, 'Available', 'Deluxe room with garden view'),
('105', 'Standard', 1800.00, 'Available', 'Standard room with modern amenities');

INSERT INTO food_menu (item_name, category, price) VALUES
('Chicken Biryani', 'Main Course', 350.00),
('Dal Makhani', 'Main Course', 200.00),
('Butter Chicken', 'Main Course', 400.00),
('Naan', 'Bread', 50.00),
('Rice', 'Rice', 80.00),
('Lassi', 'Beverage', 60.00),
('Tea', 'Beverage', 30.00),
('Coffee', 'Beverage', 40.00);

INSERT INTO inventory (item_name, quantity, supplier_name, threshold, price) VALUES
('Towels', 50, 'Textile Suppliers', 10, 120.00),
('Soap', 100, 'Personal Care Co.', 20, 20.00),
('Shampoo', 80, 'Personal Care Co.', 15, 60.00),
('Toilet Paper', 200, 'Paper Products Ltd.', 50, 15.00),
('Bed Sheets', 60, 'Textile Suppliers', 12, 400.00),
('Pillows', 40, 'Textile Suppliers', 8, 300.00);

-- Create indexes for better performance
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_housekeeping_status ON housekeeping(status);
CREATE INDEX idx_inventory_quantity ON inventory(quantity);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
