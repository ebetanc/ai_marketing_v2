-- Make role immutable after insert for non-service_role sessions
-- Date: 2025-08-18
begin;
-- Replace the role change guard to strictly forbid any role change unless service_role
create or replace function public.prevent_profile_role_escalation() returns trigger language plpgsql security definer
set search_path = public as $$ begin if TG_OP = 'UPDATE'
    and NEW.role is distinct
from OLD.role
    and (
        select auth.role()
    ) <> 'service_role' then raise exception 'profile.role is immutable after signup';
end if;
return NEW;
end;
$$;
-- Ensure trigger exists (reusing name)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'profiles_prevent_role_change'
) THEN create trigger profiles_prevent_role_change before
update on public.profiles for each row execute function public.prevent_profile_role_escalation();
END IF;
END $$;
commit;
