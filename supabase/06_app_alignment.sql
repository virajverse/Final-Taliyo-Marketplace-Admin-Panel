-- 06_app_alignment.sql
-- Align database with App (client) usage while keeping production-safe RLS

-- 1) Profiles: add missing column used by App
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles grants for authenticated users (upsert via client)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- 2) Wishlists table used by App
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user    ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_service ON public.wishlists(service_id);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Drop any prior policies for idempotency
DROP POLICY IF EXISTS "wishlists_self_select" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_self_insert" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_self_delete" ON public.wishlists;

-- Authenticated users can only access their own wishlist
CREATE POLICY "wishlists_self_select" ON public.wishlists
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "wishlists_self_insert" ON public.wishlists
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishlists_self_delete" ON public.wishlists
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Required grants for client access
GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated;

-- 3) Bookings: allow users to read their own bookings (by email or phone)
--    Phone is matched via profiles.phone digits; email via auth.email()
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_user_select" ON public.bookings;
CREATE POLICY "bookings_user_select" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    (
      auth.email() IS NOT NULL AND 
      (email = auth.email() OR customer_email = auth.email())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.phone IS NOT NULL
        AND (
          regexp_replace(coalesce(bookings.phone,''), '[^0-9]', '', 'g') = regexp_replace(p.phone, '[^0-9]', '', 'g')
          OR regexp_replace(coalesce(bookings.customer_phone,''), '[^0-9]', '', 'g') = regexp_replace(p.phone, '[^0-9]', '', 'g')
        )
    )
  );

-- Underlying privilege to let RLS evaluate
GRANT SELECT ON public.bookings TO authenticated;

-- 4) Realtime: add tables the App listens to
DO $$ BEGIN
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.wishlists';     EXCEPTION WHEN others THEN NULL; END;
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews';       EXCEPTION WHEN others THEN NULL; END;
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles';      EXCEPTION WHEN others THEN NULL; END;
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications'; EXCEPTION WHEN others THEN NULL; END;
END $$;
