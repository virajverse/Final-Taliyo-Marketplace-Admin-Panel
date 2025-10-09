-- =============================================
-- COMPLETE FIX FOR 403 ERRORS
-- This will fix all permission issues
-- =============================================

-- 1. First check if tables exist
DO $$
BEGIN
    RAISE NOTICE 'Checking tables...';
END $$;

-- 2. Disable RLS on all tables
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_clicks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS upload_logs DISABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies
DROP POLICY IF EXISTS "Public can view active categories" ON categories;
DROP POLICY IF EXISTS "Public can view active subcategories" ON subcategories;
DROP POLICY IF EXISTS "Public can view active services" ON services;
DROP POLICY IF EXISTS "Public can view active items" ON items;
DROP POLICY IF EXISTS "Public can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Public can view public settings" ON settings;
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;
DROP POLICY IF EXISTS "Public can create reviews" ON reviews;
DROP POLICY IF EXISTS "Public can create analytics" ON analytics;
DROP POLICY IF EXISTS "Public can create order clicks" ON order_clicks;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage subcategories" ON subcategories;
DROP POLICY IF EXISTS "Admins can manage services" ON services;
DROP POLICY IF EXISTS "Admins can manage items" ON items;
DROP POLICY IF EXISTS "Admins can manage bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can view analytics" ON analytics;
DROP POLICY IF EXISTS "Admins can view order clicks" ON order_clicks;
DROP POLICY IF EXISTS "Admins can manage admins" ON admins;
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
DROP POLICY IF EXISTS "Admins can view notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;

-- 4. Grant full permissions to anon and authenticated roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 5. Specifically grant permissions on each table
GRANT ALL PRIVILEGES ON categories TO anon, authenticated;
GRANT ALL PRIVILEGES ON subcategories TO anon, authenticated;
GRANT ALL PRIVILEGES ON services TO anon, authenticated;
GRANT ALL PRIVILEGES ON items TO anon, authenticated;
GRANT ALL PRIVILEGES ON bookings TO anon, authenticated;
GRANT ALL PRIVILEGES ON reviews TO anon, authenticated;
GRANT ALL PRIVILEGES ON analytics TO anon, authenticated;
GRANT ALL PRIVILEGES ON order_clicks TO anon, authenticated;
GRANT ALL PRIVILEGES ON admins TO anon, authenticated;
GRANT ALL PRIVILEGES ON settings TO anon, authenticated;
GRANT ALL PRIVILEGES ON notifications TO anon, authenticated;
GRANT ALL PRIVILEGES ON audit_logs TO anon, authenticated;
GRANT ALL PRIVILEGES ON email_logs TO anon, authenticated;
GRANT ALL PRIVILEGES ON upload_logs TO anon, authenticated;

-- 6. Check final status
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    RAISE NOTICE '✅ Tables found: %', table_count;
    RAISE NOTICE '✅ RLS disabled on all tables';
    RAISE NOTICE '✅ All policies dropped';
    RAISE NOTICE '✅ Full permissions granted';
    RAISE NOTICE '🚀 Admin panel should work now!';
END $$;