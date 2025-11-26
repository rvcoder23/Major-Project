-- Add new columns to rooms table for enhanced preferences
ALTER TABLE rooms
ADD COLUMN bed_type VARCHAR(50),
ADD COLUMN mattress_type VARCHAR(50),
ADD COLUMN view_type VARCHAR(50),
ADD COLUMN floor_level VARCHAR(20),
ADD COLUMN has_balcony BOOLEAN DEFAULT false,
ADD COLUMN is_accessible BOOLEAN DEFAULT false,
ADD COLUMN has_kitchenette BOOLEAN DEFAULT false,
ADD COLUMN is_soundproof BOOLEAN DEFAULT false,
ADD COLUMN has_air_purifier BOOLEAN DEFAULT false,
ADD COLUMN is_smoking_allowed BOOLEAN DEFAULT false,
ADD COLUMN room_size_sqft INTEGER,
ADD COLUMN max_occupancy INTEGER;

-- Create room_amenities table for many-to-many relationship
CREATE TABLE room_amenities (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    amenity_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create guest_preferences table
CREATE TABLE guest_preferences (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    bed_type_preference VARCHAR(50),
    mattress_firmness VARCHAR(50),
    pillow_type VARCHAR(50),
    view_preference VARCHAR(50),
    floor_preference VARCHAR(50),
    accessibility_needs TEXT[],
    temperature_preference VARCHAR(20),
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_room_amenities_room_id ON room_amenities(room_id);
CREATE INDEX idx_guest_preferences_booking_id ON guest_preferences(booking_id);

-- Update rooms with sample data for preferences
UPDATE rooms SET 
    bed_type = CASE 
        WHEN room_type = 'Suite' THEN 'King' 
        WHEN room_type = 'Deluxe' THEN 'Queen' 
        ELSE 'Twin' 
    END,
    mattress_type = 'Medium',
    view_type = CASE 
        WHEN room_number IN ('101', '103') THEN 'City View' 
        WHEN room_number = '104' THEN 'Garden View'
        ELSE 'Side View' 
    END,
    floor_level = CASE 
        WHEN room_number LIKE '1%' THEN 'Low-Floor' 
        WHEN room_number LIKE '2%' THEN 'Mid-Floor' 
        ELSE 'High-Floor' 
    END,
    has_balcony = (room_type = 'Suite' OR room_type = 'Deluxe'),
    is_accessible = (room_number = '101'),
    room_size_sqft = CASE 
        WHEN room_type = 'Suite' THEN 800 
        WHEN room_type = 'Deluxe' THEN 500 
        ELSE 350 
    END,
    max_occupancy = CASE 
        WHEN room_type = 'Suite' THEN 4 
        WHEN room_type = 'Deluxe' THEN 3 
        ELSE 2 
    END;

-- Insert sample amenities for rooms
INSERT INTO room_amenities (room_id, amenity_name) VALUES
(1, 'Coffee Machine'),
(1, 'Minibar'),
(1, 'Smart TV'),
(2, 'Coffee Machine'),
(3, 'Coffee Machine'),
(3, 'Minibar'),
(3, 'Smart TV'),
(3, 'Jacuzzi'),
(4, 'Coffee Machine'),
(5, 'Coffee Machine');
