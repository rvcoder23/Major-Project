-- Create admin user (INSERT instead of UPDATE)
-- This will create the admin user if it doesn't exist
-- Password: admin123
-- Hash: $2a$10$DOBN25Y4W1W4L998sUhSVqSLGL8PS3aS

-- First, make sure the table exists
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert admin user (will update if already exists)
INSERT INTO admin_users (username, password_hash)
VALUES ('admin', '$2a$10$DOBN25Y4W1W4L998sUhSVqSLGL8PS3aS')
ON CONFLICT (username) 
DO UPDATE SET password_hash = '$2a$10$DOBN25Y4W1W4L998sUhSVqSLGL8PS3aS';

-- Verify the admin user was created
SELECT id, username, created_at FROM admin_users WHERE username = 'admin';
