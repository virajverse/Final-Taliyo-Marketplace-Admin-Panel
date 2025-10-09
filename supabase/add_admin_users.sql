-- =============================================
-- ADD ADMIN USERS TO DATABASE
-- Creates both super admin and regular admin
-- =============================================

-- Clear existing admins first
DELETE FROM admins;

-- Insert Super Admin
INSERT INTO admins (email, name, role, is_active, email_verified) VALUES
('taliyotechnologies@gmail.com', 'Taliyo Super Admin', 'super_admin', true, true);

-- Insert Regular Admin
INSERT INTO admins (email, name, role, is_active, email_verified) VALUES
('admin@taliyotechnologies.com', 'Taliyo Admin', 'admin', true, true);

-- Verify admins created
SELECT 
    email, 
    name, 
    role, 
    is_active,
    created_at
FROM admins 
ORDER BY role DESC, created_at;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Admin users created successfully!';
    RAISE NOTICE '👤 Super Admin: taliyotechnologies@gmail.com';
    RAISE NOTICE '👤 Regular Admin: admin@taliyotechnologies.com';
    RAISE NOTICE '🔑 Use these credentials in login page';
END $$;