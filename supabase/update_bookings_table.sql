-- SQL Commands to Update Existing Database
-- Run these commands in your Supabase SQL editor or database client

-- 1. Add new columns to existing bookings table
ALTER TABLE bookings 
ADD COLUMN phone_number VARCHAR(15),
ADD COLUMN aadhar_number VARCHAR(12);

-- 2. Update existing bookings with sample data (optional)
-- You can remove this if you don't want sample data
UPDATE bookings 
SET phone_number = '+91-9876543210', 
    aadhar_number = '123456789012'
WHERE phone_number IS NULL;

-- 3. Make the new columns NOT NULL after adding sample data
ALTER TABLE bookings 
ALTER COLUMN phone_number SET NOT NULL,
ALTER COLUMN aadhar_number SET NOT NULL;

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone_number);
CREATE INDEX IF NOT EXISTS idx_bookings_aadhar ON bookings(aadhar_number);

-- 5. Add constraints for phone number format (optional)
-- This ensures phone numbers are in valid format
ALTER TABLE bookings 
ADD CONSTRAINT check_phone_format 
CHECK (phone_number ~ '^[+]?[0-9]{10,15}$');

-- 6. Add constraints for Aadhar number format (optional)
-- This ensures Aadhar numbers are exactly 12 digits
ALTER TABLE bookings 
ADD CONSTRAINT check_aadhar_format 
CHECK (aadhar_number ~ '^[0-9]{12}$');
