-- =============================================
-- BOOKINGS TABLE MINIMAL UPDATE
-- Only adds necessary fields to existing table
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
ADD COLUMN IF NOT EXISTS provider_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS cart_items JSONB;

-- Update existing columns to be nullable if they exist
ALTER TABLE bookings 
ALTER COLUMN customer_name DROP NOT NULL,
ALTER COLUMN customer_phone DROP NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_full_name ON bookings(full_name);
CREATE INDEX IF NOT EXISTS idx_bookings_phone_new ON bookings(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_service_title ON bookings(service_title);

-- Success message
DO $
BEGIN
    RAISE NOTICE '✅ Bookings table updated successfully!';
    RAISE NOTICE '📝 New fields added for detailed booking form';
    RAISE NOTICE '🚀 Ready for booking system!';
END $;