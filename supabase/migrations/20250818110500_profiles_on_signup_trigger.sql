-- Auto-create a profile row for every new auth user
-- Date: 2025-08-18
begin;
-- Create function (idempotent-safe create or replace)
create or replace function public.handle_new_user() returns trigger language plpgsql security definer
set search_path = public as $$ begin
insert into public.profiles (id)
values (new.id) on conflict (id) do nothing;
return new;
end;
$$;
-- Create trigger if it doesn't already exist
-- Using DO block to avoid duplicate trigger errors on reruns
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
) THEN create trigger on_auth_user_created
after
insert on auth.users for each row execute function public.handle_new_user();
END IF;
END $$;
commit;
