-- Core schema, indexes, functions, triggers (production)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========== Tables ==========
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  slug VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  slug VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (category_id, slug)
);

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,

  price_min NUMERIC(10,2),
  price_max NUMERIC(10,2),
  price_type VARCHAR(20) DEFAULT 'fixed',
  currency VARCHAR(3) DEFAULT 'INR',

  duration_minutes INTEGER,
  location VARCHAR(200),
  is_remote BOOLEAN DEFAULT false,

  images JSONB DEFAULT '[]'::jsonb,
  video_url VARCHAR(500),

  provider_name VARCHAR(100),
  provider_avatar VARCHAR(500),
  provider_bio TEXT,
  provider_phone VARCHAR(20),
  provider_email VARCHAR(100),
  provider_verified BOOLEAN DEFAULT false,

  rating_average NUMERIC(3,2) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,

  slug VARCHAR(200) UNIQUE,
  meta_title VARCHAR(200),
  meta_description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  type VARCHAR(20) DEFAULT 'service',
  price NUMERIC(10,2),
  whatsapp_link VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  item_id    UUID REFERENCES public.items(id)    ON DELETE SET NULL,

  service_title TEXT,
  service_price TEXT,
  provider_name TEXT,

  full_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  whatsapp_number TEXT,
  requirements TEXT,
  budget_range TEXT,
  delivery_preference TEXT,
  additional_notes TEXT,
  cart_items TEXT,
  files JSONB,

  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  message TEXT,

  status VARCHAR(20) DEFAULT 'pending',
  quoted_price NUMERIC(10,2),
  final_price NUMERIC(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  item_id    UUID REFERENCES public.items(id)    ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  user_ip VARCHAR(45),
  user_agent TEXT,
  referrer VARCHAR(500),
  country VARCHAR(2),
  city VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES public.items(id)       ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  click_source VARCHAR(50) DEFAULT 'web',
  user_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100),
  avatar VARCHAR(500),
  role VARCHAR(20) DEFAULT 'admin',
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'info',
  related_type VARCHAR(50),
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email VARCHAR(100) NOT NULL,
  from_email VARCHAR(100),
  subject VARCHAR(200),
  template VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  related_type VARCHAR(50),
  related_id UUID,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.upload_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  filename VARCHAR(200),
  file_size INTEGER,
  file_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'processing',
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== Indexes ==========
CREATE INDEX IF NOT EXISTS idx_categories_active     ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort       ON public.categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_slug       ON public.categories(slug);

CREATE INDEX IF NOT EXISTS idx_subcategories_cat     ON public.subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_active  ON public.subcategories(is_active);
CREATE INDEX IF NOT EXISTS idx_subcategories_slug    ON public.subcategories(slug);

CREATE INDEX IF NOT EXISTS idx_services_category     ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_subcat       ON public.services(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_services_active       ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_featured     ON public.services(is_featured);
CREATE INDEX IF NOT EXISTS idx_services_created      ON public.services(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_slug         ON public.services(slug);

CREATE INDEX IF NOT EXISTS idx_items_active          ON public.items(is_active);
CREATE INDEX IF NOT EXISTS idx_items_type            ON public.items(type);
CREATE INDEX IF NOT EXISTS idx_items_created         ON public.items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_service      ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_item         ON public.bookings(item_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created      ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_phone        ON public.bookings(phone);

CREATE INDEX IF NOT EXISTS idx_reviews_service       ON public.reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved      ON public.reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created       ON public.reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_service     ON public.analytics(service_id);
CREATE INDEX IF NOT EXISTS idx_analytics_item        ON public.analytics(item_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event       ON public.analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created     ON public.analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_clicks_item     ON public.order_clicks(item_id);
CREATE INDEX IF NOT EXISTS idx_order_clicks_service  ON public.order_clicks(service_id);
CREATE INDEX IF NOT EXISTS idx_order_clicks_created  ON public.order_clicks(created_at DESC);

-- ========== Functions & Triggers ==========
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_service_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.services
     SET rating_average = COALESCE((SELECT AVG(r.rating::numeric)
                                      FROM public.reviews r
                                     WHERE r.service_id = NEW.service_id AND r.is_approved = true), 0),
         rating_count   = COALESCE((SELECT COUNT(*)
                                      FROM public.reviews r
                                     WHERE r.service_id = NEW.service_id AND r.is_approved = true), 0)
   WHERE id = NEW.service_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at triggers
CREATE TRIGGER trg_categories_updated_at    BEFORE UPDATE ON public.categories    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_subcategories_updated_at BEFORE UPDATE ON public.subcategories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_services_updated_at      BEFORE UPDATE ON public.services      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_items_updated_at         BEFORE UPDATE ON public.items         FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_bookings_updated_at      BEFORE UPDATE ON public.bookings      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_admins_updated_at        BEFORE UPDATE ON public.admins        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_settings_updated_at      BEFORE UPDATE ON public.settings      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_profiles_updated_at      BEFORE UPDATE ON public.profiles      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- rating calc on reviews
CREATE TRIGGER trg_reviews_rating_insert AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_service_rating();
CREATE TRIGGER trg_reviews_rating_update AFTER UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_service_rating();
