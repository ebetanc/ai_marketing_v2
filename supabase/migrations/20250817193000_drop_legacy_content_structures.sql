-- Drop all legacy content views, rules, and tables; enforce unified content only
-- Date: 2025-08-17
begin;

-- Drop insert rules first (if they exist)
DO $$ BEGIN
  EXECUTE 'DROP RULE IF EXISTS twitter_content_insert ON public.twitter_content';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'DROP RULE IF EXISTS linkedin_content_insert ON public.linkedin_content';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'DROP RULE IF EXISTS newsletter_content_insert ON public.newsletter_content';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Drop compatibility views
DO $$ BEGIN
  EXECUTE 'DROP VIEW IF EXISTS public.twitter_content';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'DROP VIEW IF EXISTS public.linkedin_content';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'DROP VIEW IF EXISTS public.newsletter_content';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Drop legacy renamed tables if still present
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='twitter_content_legacy') THEN
    EXECUTE 'DROP TABLE public.twitter_content_legacy CASCADE';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='linkedin_content_legacy') THEN
    EXECUTE 'DROP TABLE public.linkedin_content_legacy CASCADE';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='newsletter_content_legacy') THEN
    EXECUTE 'DROP TABLE public.newsletter_content_legacy CASCADE';
  END IF;
END $$;

COMMIT;
