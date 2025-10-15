-- DANGER: Deletes all public schema objects (tables, data, policies, views, functions not owned by extensions)
DO $$
DECLARE r RECORD;
BEGIN
  -- Views
  FOR r IN (
    SELECT 'DROP VIEW IF EXISTS "'||schemaname||'"."'||viewname||'" CASCADE;' AS stmt
    FROM pg_views WHERE schemaname = 'public'
  ) LOOP EXECUTE r.stmt; END LOOP;

  -- Materialized Views
  FOR r IN (
    SELECT 'DROP MATERIALIZED VIEW IF EXISTS "'||schemaname||'"."'||matviewname||'" CASCADE;' AS stmt
    FROM pg_matviews WHERE schemaname = 'public'
  ) LOOP EXECUTE r.stmt; END LOOP;

  -- Functions (skip extension-owned)
  FOR r IN (
    SELECT 'DROP FUNCTION IF EXISTS '||p.oid::regprocedure||' CASCADE;' AS stmt
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_depend d
        JOIN pg_extension e ON e.oid = d.refobjid
        WHERE d.objid = p.oid AND d.deptype = 'e' -- owned by extension
      )
  ) LOOP EXECUTE r.stmt; END LOOP;

  -- Tables (drops RLS policies automatically)
  FOR r IN (
    SELECT 'DROP TABLE IF EXISTS "'||schemaname||'"."'||tablename||'" CASCADE;' AS stmt
    FROM pg_tables WHERE schemaname = 'public'
  ) LOOP EXECUTE r.stmt; END LOOP;

  -- Sequences
  FOR r IN (
    SELECT 'DROP SEQUENCE IF EXISTS "'||sequence_schema||'"."'||sequence_name||'" CASCADE;' AS stmt
    FROM information_schema.sequences WHERE sequence_schema = 'public'
  ) LOOP EXECUTE r.stmt; END LOOP;

  -- Enum types
  FOR r IN (
    SELECT 'DROP TYPE IF EXISTS "'||n.nspname||'"."'||t.typname||'" CASCADE;' AS stmt
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e'
  ) LOOP EXECUTE r.stmt; END LOOP;
END$$;

-- Tighten privileges (optional)
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE USAGE ON SCHEMA public FROM anon, authenticated;
