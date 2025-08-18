-- Guard profile role changes to service role only, and refine update policy
-- Date: 2025-08-18
begin;
-- Replace update policy to allow self or service_role to perform updates
drop policy if exists "Profiles update own" on public.profiles;
create policy "Profiles update own" on public.profiles for
update to authenticated using (
        id = (
            select auth.uid()
        )
        or (
            select auth.role()
        ) = 'service_role'
    ) with check (
        id = (
            select auth.uid()
        )
        or (
            select auth.role()
        ) = 'service_role'
    );
-- Trigger to prevent role changes by non-service role
create or replace function public.prevent_profile_role_escalation() returns trigger language plpgsql security definer
set search_path = public as $$ begin if NEW.role is distinct
from OLD.role
    and (
        select auth.role()
    ) <> 'service_role' then raise exception 'Only service role can change profile.role';
end if;
return NEW;
end;
$$;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'profiles_prevent_role_change'
) THEN create trigger profiles_prevent_role_change before
update on public.profiles for each row execute function public.prevent_profile_role_escalation();
END IF;
END $$;
commit;
