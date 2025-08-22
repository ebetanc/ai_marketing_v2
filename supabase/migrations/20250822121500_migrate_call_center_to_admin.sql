-- Migrate existing legacy 'call_center' users to 'admin'
-- Date: 2025-08-22
-- Notes:
--  * Signup already restricted to marketing / real_estate (see prior migration)
--  * This keeps enum value 'call_center' for now to avoid complex enum surgery; can be dropped later if desired
--  * Idempotent: safe to re-run; only changes rows still tagged call_center
begin;
update public.profiles
set role = 'admin'
where role = 'call_center';
commit;
