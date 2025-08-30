-- Recreate signup handler without enum dependency after converting profiles.role to text
-- Date: 2025-08-30
-- Idempotent: create or replace function; ensures no reference to dropped type public.user_role
begin;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer
set search_path = public as $$
DECLARE v_role text;
begin -- Read desired role; fallback to 'user'
v_role := lower(
  coalesce(NEW.raw_user_meta_data->>'role', 'user')
);
-- Optional: clamp to allowed set if we want; for now accept any string provided
insert into public.profiles (id, role)
values (NEW.id, v_role) on conflict (id) do nothing;
return NEW;
end;
$$;
commit;
