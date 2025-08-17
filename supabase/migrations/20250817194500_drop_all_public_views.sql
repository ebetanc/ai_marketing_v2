-- Drop all custom views in the public schema (regular and materialized)
-- Date: 2025-08-17
begin;

-- 1) Drop all regular views in public
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT table_schema, table_name
    FROM information_schema.views
    WHERE table_schema = 'public'
  ) LOOP
    EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', r.table_schema, r.table_name);
  END LOOP;
END$$;

-- 2) Drop all materialized views in public (if any)
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT schemaname AS table_schema, matviewname AS table_name
    FROM pg_matviews
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS %I.%I CASCADE', r.table_schema, r.table_name);
  END LOOP;
END$$;

commit;
