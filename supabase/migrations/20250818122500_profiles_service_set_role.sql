-- Service-only function to set a user's profile role (e.g., promote to admin)
-- Date: 2025-08-18
begin;
create or replace function public.set_user_role(p_user_id uuid, p_role public.user_role) returns void language plpgsql security definer
set search_path = public as $$ begin if (
        select auth.role()
    ) <> 'service_role' then raise exception 'set_user_role can only be called with service_role';
end if;
update public.profiles
set role = p_role
where id = p_user_id;
end;
$$;
commit;
