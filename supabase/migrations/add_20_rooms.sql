-- Add 20 Rooms with Consecutive Numbering (101-120)
-- Basic version matching current schema (room_number, room_type, rate_per_night, status, description)

-- Delete ALL existing rooms from 101-120 to avoid duplicates
DELETE FROM rooms WHERE room_number IN (
  '101', '102', '103', '104', '105', '106', '107', '108', '109', '110',
  '111', '112', '113', '114', '115', '116', '117', '118', '119', '120'
);

-- Insert 20 rooms with consecutive numbering (101-120)
INSERT INTO rooms (room_number, room_type, rate_per_night, status, description) VALUES
-- Rooms 101-105 (Standard Rooms)
('101', 'Standard', 1800.00, 'Available', 'Comfortable standard room with modern amenities'),
('102', 'Standard', 1800.00, 'Available', 'Cozy standard room perfect for business travelers'),
('103', 'Standard', 1800.00, 'Available', 'Well-appointed standard room'),
('104', 'Standard', 1850.00, 'Available', 'Standard room with extra amenities'),
('105', 'Standard', 1800.00, 'Available', 'Comfortable and affordable standard room'),

-- Rooms 106-115 (Deluxe Rooms)
('106', 'Deluxe', 2500.00, 'Available', 'Spacious deluxe room with city view'),
('107', 'Deluxe', 2500.00, 'Available', 'Elegant deluxe room with premium bedding'),
('108', 'Deluxe', 2600.00, 'Available', 'Deluxe room with garden view and balcony'),
('109', 'Deluxe', 2500.00, 'Available', 'Modern deluxe room with contemporary design'),
('110', 'Deluxe', 2500.00, 'Available', 'Luxurious deluxe room with premium amenities'),
('111', 'Deluxe', 2550.00, 'Available', 'Corner deluxe room with panoramic views'),
('112', 'Deluxe', 2500.00, 'Available', 'Deluxe room perfect for couples'),
('113', 'Deluxe', 2500.00, 'Available', 'Premium deluxe room with modern facilities'),
('114', 'Deluxe', 2500.00, 'Available', 'Spacious deluxe room with work desk'),
('115', 'Deluxe', 2500.00, 'Available', 'Deluxe room with enhanced comfort'),

-- Rooms 116-120 (Suite Rooms)
('116', 'Suite', 4500.00, 'Available', 'Luxury suite with separate living area'),
('117', 'Suite', 4500.00, 'Available', 'Executive suite with premium amenities'),
('118', 'Suite', 5000.00, 'Available', 'Presidential suite with panoramic views'),
('119', 'Suite', 4500.00, 'Available', 'Elegant suite with modern luxury'),
('120', 'Suite', 4800.00, 'Available', 'Grand suite with exclusive facilities');

-- Verify the insertion
SELECT COUNT(*) as total_rooms FROM rooms;
SELECT room_number, room_type, rate_per_night, status FROM rooms ORDER BY room_number;
