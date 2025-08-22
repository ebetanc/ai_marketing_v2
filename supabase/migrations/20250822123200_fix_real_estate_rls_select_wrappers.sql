-- Purpose: Fix linter 0003_auth_rls_initplan warnings for public.real_estate_content
--          Ensures auth.uid() is wrapped in SELECT so it's evaluated once per statement.
-- Date: 2025-08-22 (unique version after backfill migrations)
-- Notes:
--  * Earlier attempt used version 20250822123000 which collided with another migration already applied remotely.
--  * This file is identical in intent; only timestamp/version changed to avoid duplicate key.
--  * Idempotent via DROP POLICY IF EXISTS.
begin;
-- SELECT policy
drop policy if exists "Real estate select own" on public.real_estate_content;
create policy "Real estate select own" on public.real_estate_content for
select to authenticated using (
        owner_id is not null
        and owner_id = (
            select auth.uid()
        )
    );
-- INSERT policy
drop policy if exists "Real estate insert own" on public.real_estate_content;
create policy "Real estate insert own" on public.real_estate_content for
insert to authenticated with check (
        owner_id is not null
        and owner_id = (
            select auth.uid()
        )
    );
-- UPDATE policy
drop policy if exists "Real estate update own" on public.real_estate_content;
create policy "Real estate update own" on public.real_estate_content for
update to authenticated using (
        owner_id is not null
        and owner_id = (
            select auth.uid()
        )
    ) with check (
        owner_id is not null
        and owner_id = (
            select auth.uid()
        )
    );
-- DELETE policy (cascade allowance retained)
drop policy if exists "Real estate delete own" on public.real_estate_content;
create policy "Real estate delete own" on public.real_estate_content for delete to authenticated using (
    pg_trigger_depth() > 0
    or (
        owner_id is not null
        and owner_id = (
            select auth.uid()
        )
    )
);
commit;
