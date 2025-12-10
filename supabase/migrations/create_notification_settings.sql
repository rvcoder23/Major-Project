-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id INTEGER PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  low_stock_alerts BOOLEAN DEFAULT TRUE,
  booking_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create simple trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
