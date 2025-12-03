-- Payment Methods and Updated GST Taxation Schema

-- Add payment_method column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'Cash';

-- Update GST columns if they don't exist (for backward compatibility)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_amount DECIMAL(10,2) DEFAULT 0;

-- Create payment_methods reference table (optional, for consistency)
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    method_name VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default payment methods
INSERT INTO payment_methods (method_name, is_active) VALUES
('Cash', true),
('Credit Card', true),
('Debit Card', true),
('UPI', true),
('Net Banking', true),
('Cheque', true),
('Bank Transfer', true)
ON CONFLICT (method_name) DO NOTHING;

-- Create index for payment method
CREATE INDEX IF NOT EXISTS idx_bookings_payment_method ON bookings(payment_method);
CREATE INDEX IF NOT EXISTS idx_bookings_gst_rate ON bookings(gst_rate);

