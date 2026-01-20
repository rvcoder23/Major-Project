-- Migration: Separate Reservation and Check-in
-- This migration adds proper tracking for reservation vs actual check-in/check-out

-- 1. Add new columns for reservation and actual check-in/check-out tracking
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reservation_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS reservation_time TIME DEFAULT CURRENT_TIME,
ADD COLUMN IF NOT EXISTS actual_checkin_date DATE,
ADD COLUMN IF NOT EXISTS actual_checkin_time TIME,
ADD COLUMN IF NOT EXISTS actual_checkout_date DATE,
ADD COLUMN IF NOT EXISTS actual_checkout_time TIME;

-- 2. Update existing bookings to have proper data
-- Assume existing "Active" bookings are already checked-in
UPDATE bookings
SET 
  booking_status = 'Checked-In',
  reservation_date = created_at::DATE,
  reservation_time = created_at::TIME,
  actual_checkin_date = check_in,
  actual_checkin_time = created_at::TIME
WHERE booking_status = 'Active';

-- Update existing "Completed" bookings
UPDATE bookings
SET 
  booking_status = 'Checked-Out',
  reservation_date = created_at::DATE,
  reservation_time = created_at::TIME,
  actual_checkin_date = check_in,
  actual_checkin_time = created_at::TIME,
  actual_checkout_date = check_out,
  actual_checkout_time = created_at::TIME
WHERE booking_status = 'Completed';

-- 3. Update booking_status constraint to include new statuses
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_booking_status_check;

ALTER TABLE bookings
ADD CONSTRAINT bookings_booking_status_check
CHECK (booking_status IN ('Reserved', 'Checked-In', 'Checked-Out', 'Cancelled', 'No-Show'));

-- 4. Update room status constraint to include 'Reserved'
ALTER TABLE rooms
DROP CONSTRAINT IF EXISTS rooms_status_check;

ALTER TABLE rooms
ADD CONSTRAINT rooms_status_check
CHECK (status IN ('Available', 'Reserved', 'Occupied', 'Maintenance', 'Cleaning'));

-- 5. Add comments for documentation
COMMENT ON COLUMN bookings.reservation_date IS 'Date when reservation was made';
COMMENT ON COLUMN bookings.reservation_time IS 'Time when reservation was made';
COMMENT ON COLUMN bookings.actual_checkin_date IS 'Date when guest actually checked in';
COMMENT ON COLUMN bookings.actual_checkin_time IS 'Time when guest actually checked in';
COMMENT ON COLUMN bookings.actual_checkout_date IS 'Date when guest actually checked out';
COMMENT ON COLUMN bookings.actual_checkout_time IS 'Time when guest actually checked out';
COMMENT ON COLUMN bookings.check_in IS 'Expected check-in date (from reservation)';
COMMENT ON COLUMN bookings.check_out IS 'Expected check-out date (from reservation)';

-- 6. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_reservation_date ON bookings(reservation_date);
CREATE INDEX IF NOT EXISTS idx_bookings_actual_checkin ON bookings(actual_checkin_date);
