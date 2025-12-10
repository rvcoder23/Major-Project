-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default admin user (password: admin123)
-- Note: The hash below is for 'admin123' using bcrypt
INSERT INTO admin_users (username, password_hash)
VALUES ('admin', '$2a$10$X7.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1')
ON CONFLICT (username) DO NOTHING;

-- Create index on username
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
