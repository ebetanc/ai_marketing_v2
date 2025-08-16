-- Converted to no-op to keep shared migrations production-safe.
begin;
drop function if exists public.dev_create_auth_user(uuid, text);
commit;
