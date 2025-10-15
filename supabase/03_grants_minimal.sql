-- Minimal grants for public (anon/authenticated) roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.categories, public.subcategories, public.services
  TO anon, authenticated;

GRANT SELECT ON public.reviews, public.settings
  TO anon, authenticated;

-- No INSERT/UPDATE/DELETE grants for anon/authenticated on sensitive tables.
-- Admin/API uses service role (bypasses RLS) for writes.
