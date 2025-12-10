-- Reset admin password to 'admin123'
-- Hash generated using bcryptjs with salt rounds 10
-- Generated on: 2025-12-06
UPDATE admin_users
SET password_hash = '$2a$10$DOBN25Y4W1W4L998sUhSVqSLGL8PS3aS'
WHERE username = 'admin';
