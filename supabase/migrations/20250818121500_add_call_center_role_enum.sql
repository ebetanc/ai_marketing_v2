-- Add 'call_center' to public.user_role enum
-- Date: 2025-08-18
begin;
DO $$ BEGIN -- Add only if it doesn't already exist
IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
        AND t.typname = 'user_role'
        AND e.enumlabel = 'call_center'
) THEN ALTER TYPE public.user_role
ADD VALUE 'call_center';
END IF;
END $$;
commit;
