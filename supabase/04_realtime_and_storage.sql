-- Realtime publication and storage bucket setup (idempotent)

-- Add tables to Supabase realtime publication, ignoring duplicates
DO $$ BEGIN
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.services';          EXCEPTION WHEN others THEN NULL; END;
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.categories';        EXCEPTION WHEN others THEN NULL; END;
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.subcategories';     EXCEPTION WHEN others THEN NULL; END;
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.items';             EXCEPTION WHEN others THEN NULL; END;
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.order_clicks';      EXCEPTION WHEN others THEN NULL; END;
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.admins';            EXCEPTION WHEN others THEN NULL; END;
  BEGIN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings';          EXCEPTION WHEN others THEN NULL; END;
END $$;

-- Private storage bucket for booking file uploads used by App API
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-files', 'booking-files', false)
ON CONFLICT (id) DO NOTHING;
