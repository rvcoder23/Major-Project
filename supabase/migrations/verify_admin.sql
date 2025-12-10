-- Verify admin user exists and check password hash
SELECT 
    id,
    username,
    password_hash,
    created_at,
    LENGTH(password_hash) as hash_length,
    CASE 
        WHEN password_hash LIKE '$2a$10$%' OR password_hash LIKE '$2b$10$%' THEN 'Valid bcrypt format'
        ELSE 'Invalid hash format'
    END as hash_validity
FROM admin_users
WHERE username = 'admin';
