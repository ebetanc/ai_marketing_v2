-- Add 'marketing' and 'real_estate' roles.
-- (Signup handler & default moved to later migration to avoid enum use-in-transaction error 55P04.)
-- Date: 2025-08-22
begin;
-- Add enum values if they don't already exist (safe for repeated runs)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
        AND t.typname = 'user_role'
        AND e.enumlabel = 'marketing'
) THEN ALTER TYPE public.user_role
ADD VALUE 'marketing';
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
        AND t.typname = 'user_role'
        AND e.enumlabel = 'real_estate'
) THEN ALTER TYPE public.user_role
ADD VALUE 'real_estate';
END IF;
END $$;
commit;
