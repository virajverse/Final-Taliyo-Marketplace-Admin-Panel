-- Row Level Security: production-safe minimal policies

-- Enable RLS (idempotent)
ALTER TABLE public.categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_clicks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;

-- Clean existing policies (safe to run multiple times)
DROP POLICY IF EXISTS "pub_categories_read"     ON public.categories;
DROP POLICY IF EXISTS "pub_subcategories_read"  ON public.subcategories;
DROP POLICY IF EXISTS "pub_services_read"       ON public.services;
DROP POLICY IF EXISTS "pub_items_read"          ON public.items;
DROP POLICY IF EXISTS "pub_reviews_read"        ON public.reviews;
DROP POLICY IF EXISTS "pub_settings_read"       ON public.settings;
DROP POLICY IF EXISTS "profiles_self_select"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_insert"    ON public.profiles;

-- Public READ (for App)
CREATE POLICY "pub_categories_read"    ON public.categories    FOR SELECT USING (is_active = true);
CREATE POLICY "pub_subcategories_read" ON public.subcategories FOR SELECT USING (is_active = true);
CREATE POLICY "pub_services_read"      ON public.services      FOR SELECT USING (is_active = true);
-- Optional: expose items publicly if the App needs it
-- CREATE POLICY "pub_items_read"         ON public.items         FOR SELECT USING (is_active = true);
CREATE POLICY "pub_reviews_read"       ON public.reviews       FOR SELECT USING (is_approved = true);
CREATE POLICY "pub_settings_read"      ON public.settings      FOR SELECT USING (is_public = true);

-- Profiles: user can access only own row
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Important: No public INSERT/UPDATE/DELETE on bookings/services/categories.
-- Admin writes should go through server APIs using the service role, which bypasses RLS.
