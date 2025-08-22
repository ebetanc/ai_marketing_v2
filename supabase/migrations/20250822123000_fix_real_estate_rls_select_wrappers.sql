-- Purpose: Fix linter 0003_auth_rls_initplan warnings for public.real_estate_content
--          Ensures auth.uid() is wrapped in SELECT so it's evaluated once per statement.
-- Date: 2025-08-22
-- Notes:
--  * Recreates the four owner-scoped policies with (select auth.uid()).
--  * Preserves cascade delete (pg_trigger_depth() > 0) behavior introduced earlier for delete.
begin;
-- SELECT (read) policy
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
-- DELETE policy (retain cascade allowance)
-- Allows owner deletes OR deletes invoked by FK ON DELETE CASCADE (trigger depth > 0)
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
