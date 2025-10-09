-- =============================================
-- RESET ADMIN USERS
-- Remove all existing admins and create new super admin
-- =============================================

-- Delete all existing admin users
DELETE FROM admins;

-- Insert new super admin
INSERT INTO admins (email, name, role, is_active, email_verified) VALUES
('taliyotechnologies@gmail.com', 'Taliyo Super Admin', 'super_admin', true, true);

-- Verify the change
SELECT * FROM admins;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Admin users reset successfully!';
    RAISE NOTICE '📧 Super Admin: taliyotechnologies@gmail.com';
    RAISE NOTICE '🔑 Role: super_admin';
    RAISE NOTICE '✨ Ready to login!';
END $$;
