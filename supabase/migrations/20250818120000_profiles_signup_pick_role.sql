-- Capture role from user_metadata at signup, default to 'user'
-- Date: 2025-08-18
begin;
-- Update the signup handler to set role from raw_user_meta_data.role if provided
create or replace function public.handle_new_user() returns trigger language plpgsql security definer
set search_path = public as $$
declare v_role public.user_role;
begin -- Try to read a 'role' from user metadata; fallback to 'user'
begin v_role := lower(
    coalesce((NEW.raw_user_meta_data->>'role'), 'user')
)::public.user_role;
exception
when others then v_role := 'user';
end;
insert into public.profiles (id, role)
values (NEW.id, v_role) on conflict (id) do nothing;
return NEW;
end;
$$;
commit;
