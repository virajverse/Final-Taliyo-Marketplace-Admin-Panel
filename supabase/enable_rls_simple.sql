-- =============================================
-- ENABLE RLS WITH SIMPLE POLICIES
-- Simple approach - anon role gets full access
-- =============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SIMPLE POLICIES - ALLOW ALL ACCESS
-- =============================================

-- Categories
CREATE POLICY "Allow all access to categories" ON categories FOR ALL USING (true);

-- Subcategories
CREATE POLICY "Allow all access to subcategories" ON subcategories FOR ALL USING (true);

-- Services
CREATE POLICY "Allow all access to services" ON services FOR ALL USING (true);

-- Items
CREATE POLICY "Allow all access to items" ON items FOR ALL USING (true);

-- Bookings
CREATE POLICY "Allow all access to bookings" ON bookings FOR ALL USING (true);

-- Reviews
CREATE POLICY "Allow all access to reviews" ON reviews FOR ALL USING (true);

-- Analytics
CREATE POLICY "Allow all access to analytics" ON analytics FOR ALL USING (true);

-- Order Clicks
CREATE POLICY "Allow all access to order_clicks" ON order_clicks FOR ALL USING (true);

-- Admins
CREATE POLICY "Allow all access to admins" ON admins FOR ALL USING (true);

-- Settings
CREATE POLICY "Allow all access to settings" ON settings FOR ALL USING (true);

-- Notifications
CREATE POLICY "Allow all access to notifications" ON notifications FOR ALL USING (true);

-- Audit Logs
CREATE POLICY "Allow all access to audit_logs" ON audit_logs FOR ALL USING (true);

-- Email Logs
CREATE POLICY "Allow all access to email_logs" ON email_logs FOR ALL USING (true);

-- Upload Logs
CREATE POLICY "Allow all access to upload_logs" ON upload_logs FOR ALL USING (true);

-- =============================================
-- GRANT FULL PERMISSIONS
-- =============================================

-- Grant all permissions to anon and authenticated roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS enabled with simple policies';
    RAISE NOTICE '🔓 All users have full access';
    RAISE NOTICE '🚀 Admin panel should work perfectly';
    RAISE NOTICE '✨ Database ready for development!';
END $$;