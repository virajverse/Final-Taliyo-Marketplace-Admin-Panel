-- Minimal grants for public (anon/authenticated) roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.categories, public.subcategories, public.services
  TO anon, authenticated;

GRANT SELECT ON public.reviews, public.settings
  TO anon, authenticated;

-- No INSERT/UPDATE/DELETE grants for anon/authenticated on sensitive tables.
-- Admin/API uses service role (bypasses RLS) for writes.

-- Server-only: ensure service_role can fully access public schema
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- (Optional) future tables: grant defaults to service_role
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
