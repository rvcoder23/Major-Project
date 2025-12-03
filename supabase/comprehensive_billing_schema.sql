-- Comprehensive Billing and Payment System Schema

-- Update food_orders table with payment methods and GST
ALTER TABLE food_orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'Cash',
ADD COLUMN IF NOT EXISTS base_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);

-- Update accounts table with payment methods
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'Cash',
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);

-- Create bills/invoices table for comprehensive billing
CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    guest_name VARCHAR(100) NOT NULL,
    guest_phone VARCHAR(15),
    guest_aadhar VARCHAR(12),
    bill_date DATE DEFAULT CURRENT_DATE,
    bill_time TIME DEFAULT CURRENT_TIME,
    check_in_date DATE,
    check_out_date DATE,
    room_number VARCHAR(10),
    room_type VARCHAR(50),
    
    -- Amounts
    subtotal DECIMAL(10,2) DEFAULT 0,
    gst_rate DECIMAL(5,2) DEFAULT 0,
    gst_amount DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment
    payment_method VARCHAR(50) DEFAULT 'Cash',
    payment_status VARCHAR(20) DEFAULT 'Pending',
    payment_reference VARCHAR(100),
    
    -- Additional info
    billing_address TEXT,
    hotel_name VARCHAR(200) DEFAULT 'Front Office Management Hotel',
    hotel_address TEXT,
    hotel_phone VARCHAR(20),
    hotel_email VARCHAR(100),
    hotel_gstin VARCHAR(15),
    
    notes TEXT,
    created_by VARCHAR(100) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create bill_items table to store individual line items
CREATE TABLE IF NOT EXISTS bill_items (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'Room', 'Food', 'Service', 'Other'
    item_description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL,
    gst_rate DECIMAL(5,2) DEFAULT 0,
    gst_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    item_date DATE,
    reference_id INTEGER, -- Links to booking_id, food_order_id, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bills_invoice_number ON bills(invoice_number);
CREATE INDEX IF NOT EXISTS idx_bills_booking_id ON bills(booking_id);
CREATE INDEX IF NOT EXISTS idx_bills_guest_name ON bills(guest_name);
CREATE INDEX IF NOT EXISTS idx_bills_bill_date ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_food_orders_payment_method ON food_orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_food_orders_invoice_number ON food_orders(invoice_number);
CREATE INDEX IF NOT EXISTS idx_accounts_payment_method ON accounts(payment_method);

