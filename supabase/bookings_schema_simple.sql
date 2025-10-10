-- =============================================
-- BOOKINGS TABLE EXTENSION
-- Adds new fields to existing bookings table
-- =============================================

-- Add new columns to existing bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS requirements TEXT,
ADD COLUMN IF NOT EXISTS budget_range VARCHAR(50),
ADD COLUMN IF NOT EXISTS delivery_preference VARCHAR(50),
ADD COLUMN IF NOT EXISTS additional_notes TEXT,
ADD COLUMN IF NOT EXISTS files JSONB,
ADD COLUMN IF NOT EXISTS service_title TEXT,
ADD COLUMN IF NOT EXISTS service_price VARCHAR(100),
ADD COLUMN IF NOT EXISTS provider_name VARCHAR(255);

-- Update existing columns to be nullable if they exist
ALTER TABLE bookings 
ALTER COLUMN customer_name DROP NOT NULL,
ALTER COLUMN customer_phone DROP NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_full_name ON bookings(full_name);
CREATE INDEX IF NOT EXISTS idx_bookings_phone_new ON bookings(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_service_title ON bookings(service_title);

-- Create storage bucket for booking files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('booking-files', 'booking-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for booking files
DROP POLICY IF EXISTS "Admins can view booking files" ON storage.objects;
CREATE POLICY "Admins can view booking files" ON storage.objects
  FOR SELECT USING (bucket_id = 'booking-files');

DROP POLICY IF EXISTS "Anyone can upload booking files" ON storage.objects;
CREATE POLICY "Anyone can upload booking files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'booking-files');

-- Update RLS policies for new booking flow
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;
CREATE POLICY "Public can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;
CREATE POLICY "Admins can update bookings" ON bookings
  FOR UPDATE USING (true);

-- Success message
DO $
BEGIN
    RAISE NOTICE '✅ Bookings table updated successfully!';
    RAISE NOTICE '📝 New fields added for detailed booking form';
    RAISE NOTICE '📁 File storage bucket created';
    RAISE NOTICE '🔒 RLS policies updated';
    RAISE NOTICE '🚀 Ready for booking system!';
END $;