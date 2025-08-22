-- Backfill missing profile rows for existing auth users
-- Date: 2025-08-22
-- Reason: Some users were created before the handle_new_user trigger or during a failure; ensure each auth.users.id has a profiles row.
begin;
-- Safety: (Re)ensure trigger exists (noop if already there)
create or replace function public.handle_new_user() returns trigger language plpgsql security definer
set search_path = public as $$
declare v_role public.user_role := 'marketing';
begin -- Parse provided role; fallback to marketing; whitelist known roles
begin v_role := lower(
    coalesce(NEW.raw_user_meta_data->>'role', 'marketing')
)::public.user_role;
exception
when others then v_role := 'marketing';
end;
if v_role not in (
    'admin',
    'user',
    'marketing',
    'real_estate',
    'call_center'
) then v_role := 'marketing';
end if;
insert into public.profiles (id, role)
values (NEW.id, v_role) on conflict (id) do nothing;
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
-- Backfill missing rows
insert into public.profiles (id, role)
select u.id,
    (
        case
            lower(coalesce(u.raw_user_meta_data->>'role', ''))
            when 'admin' then 'admin'::public.user_role
            when 'user' then 'user'::public.user_role
            when 'marketing' then 'marketing'::public.user_role
            when 'real_estate' then 'real_estate'::public.user_role
            when 'call_center' then 'call_center'::public.user_role
            else 'marketing'::public.user_role
        end
    ) as role
from auth.users u
    left join public.profiles p on p.id = u.id
where p.id is null;
commit;
-- Verification (optional):
-- select count(*) as missing_after from auth.users u left join public.profiles p on p.id = u.id where p.id is null;
