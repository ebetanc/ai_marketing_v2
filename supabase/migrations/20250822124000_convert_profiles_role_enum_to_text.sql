-- Convert profiles.role from enum public.user_role to plain text and drop enum
-- Date: 2025-08-22
-- Steps:
--  1. Add new text column role_text
--  2. Copy values
--  3. Drop constraints / default referencing enum
--  4. Drop old column, rename new column to role
--  5. Drop enum type if no longer used
begin;
-- 1. Add new column if not exists
alter table public.profiles
add column if not exists role_text text;
-- 2. Copy values (only for rows where role_text is null)
update public.profiles
set role_text = role::text
where role_text is null;
-- 3. Remove default on old enum column (ignore errors)
DO $$ BEGIN BEGIN
ALTER TABLE public.profiles
ALTER COLUMN role DROP DEFAULT;
EXCEPTION
WHEN others THEN NULL;
END;
END $$;
-- 4. Drop old enum column and rename
alter table public.profiles drop column role;
alter table public.profiles
    rename column role_text to role;
-- 5. Drop enum type if unused
DO $$ BEGIN -- If no columns still use the enum, drop dependent functions then the type
IF NOT EXISTS (
    SELECT 1
    FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        JOIN pg_type t ON a.atttypid = t.oid
        JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
        AND t.typname = 'user_role'
) THEN -- Drop function set_user_role if it still references enum
IF EXISTS (
    SELECT 1
    FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
        AND p.proname = 'set_user_role'
) THEN DROP FUNCTION public.set_user_role(uuid, public.user_role);
END IF;
DROP TYPE IF EXISTS public.user_role;
END IF;
END $$;
commit;
