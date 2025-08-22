-- Backfill missing profile rows for existing auth users as admin
-- Date: 2025-08-22
-- Reason: Some users were created before the handle_new_user trigger or during a failure; ensure each auth.users.id has a profiles row.
begin;
-- Safety: (Re)ensure trigger exists (noop if already there)
create or replace function public.handle_new_user() returns trigger language plpgsql security definer
set search_path = public as $$ begin -- For any new auth user without explicit profile role logic, default to marketing (unchanged behavior elsewhere)
insert into public.profiles (id, role)
values (NEW.id, 'marketing') on conflict (id) do nothing;
return NEW;
end;
$$;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
) THEN create trigger on_auth_user_created
after
insert on auth.users for each row execute function public.handle_new_user();
END IF;
END $$;
-- Backfill missing rows explicitly as admin
insert into public.profiles (id, role)
select u.id,
    'admin'::public.user_role
from auth.users u
    left join public.profiles p on p.id = u.id
where p.id is null;
commit;
-- Verification (optional):
-- select count(*) as missing_after from auth.users u left join public.profiles p on p.id = u.id where p.id is null;
