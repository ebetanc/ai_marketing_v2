-- Force signup role to 'call_center' and set default accordingly
-- Date: 2025-08-18
begin;
-- Set profiles.role default to 'call_center'
alter table public.profiles
alter column role
set default 'call_center';
-- Sanitize signup: only allow 'call_center' from user metadata
create or replace function public.handle_new_user() returns trigger language plpgsql security definer
set search_path = public as $$
declare v_role public.user_role := 'call_center';
begin -- Try to parse provided role, else default to call_center
begin v_role := lower(
    coalesce(NEW.raw_user_meta_data->>'role', 'call_center')
)::public.user_role;
exception
when others then v_role := 'call_center';
end;
-- Enforce only call_center at signup for end users
if v_role <> 'call_center' then v_role := 'call_center';
end if;
insert into public.profiles (id, role)
values (NEW.id, v_role) on conflict (id) do nothing;
return NEW;
end;
$$;
commit;
