-- Add email column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add comment
COMMENT ON COLUMN bookings.email IS 'Guest email address for booking confirmation and communication';
