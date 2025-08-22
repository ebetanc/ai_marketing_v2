-- Add 'marketing' and 'real_estate' roles; allow choosing them at signup; default new signups to 'marketing'
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
-- Set default for future rows (signup handler explicitly inserts role, but keep consistent)
alter table public.profiles
alter column role
set default 'marketing';
-- Replace signup handler to whitelist only marketing & real_estate for new users.
-- Existing roles like 'call_center' remain valid for existing accounts but cannot be chosen on new signup.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer
set search_path = public as $$
declare v_role public.user_role := 'marketing';
begin -- Attempt to parse provided role; fallback to 'marketing'
begin v_role := lower(
    coalesce(NEW.raw_user_meta_data->>'role', 'marketing')
)::public.user_role;
exception
when others then v_role := 'marketing';
end;
-- Allow only marketing or real_estate for fresh signups
if v_role not in ('marketing', 'real_estate') then v_role := 'marketing';
end if;
insert into public.profiles (id, role)
values (NEW.id, v_role) on conflict (id) do nothing;
return NEW;
end;
$$;
commit;
