-- Purpose: Ensure ON DELETE CASCADE works with RLS by allowing deletes
-- triggered by FK cascades (pg_trigger_depth() > 0) across owned tables.
-- Date: 2025-08-17
begin;
-- Companies: allow delete when invoked by FK cascade or by owner
drop policy if exists "Companies delete own" on public.companies;
create policy "Companies delete own" on public.companies for delete to authenticated using (
    pg_trigger_depth() > 0
    or (
        owner_id is not null
        and owner_id = (
            select auth.uid()
        )
    )
);
-- Strategies: allow delete when invoked by FK cascade or via owner through company
drop policy if exists "Strategies via company" on public.strategies;
create policy "Strategies via company" on public.strategies for all to authenticated using (
    pg_trigger_depth() > 0
    or exists (
        select 1
        from public.companies c
        where c.id = strategies.company_id
            and c.owner_id = (
                select auth.uid()
            )
    )
) with check (
    exists (
        select 1
        from public.companies c
        where c.id = strategies.company_id
            and c.owner_id = (
                select auth.uid()
            )
    )
);
-- Ideas: allow delete when invoked by FK cascade or via owner through company
drop policy if exists "Ideas via company" on public.ideas;
create policy "Ideas via company" on public.ideas for all to authenticated using (
    pg_trigger_depth() > 0
    or exists (
        select 1
        from public.companies c
        where c.id = ideas.company_id
            and c.owner_id = (
                select auth.uid()
            )
    )
) with check (
    exists (
        select 1
        from public.companies c
        where c.id = ideas.company_id
            and c.owner_id = (
                select auth.uid()
            )
    )
);
-- twitter_content: allow delete when invoked by FK cascade or via owner through idea->company
drop policy if exists "Twitter content via idea->company" on public.twitter_content;
create policy "Twitter content via idea->company" on public.twitter_content for all to authenticated using (
    pg_trigger_depth() > 0
    or exists (
        select 1
        from public.ideas i
            join public.companies c on c.id = i.company_id
        where i.id = twitter_content.idea_id
            and c.owner_id = (
                select auth.uid()
            )
    )
) with check (
    exists (
        select 1
        from public.ideas i
            join public.companies c on c.id = i.company_id
        where i.id = twitter_content.idea_id
            and c.owner_id = (
                select auth.uid()
            )
    )
);
-- linkedin_content
drop policy if exists "LinkedIn content via idea->company" on public.linkedin_content;
create policy "LinkedIn content via idea->company" on public.linkedin_content for all to authenticated using (
    pg_trigger_depth() > 0
    or exists (
        select 1
        from public.ideas i
            join public.companies c on c.id = i.company_id
        where i.id = linkedin_content.idea_id
            and c.owner_id = (
                select auth.uid()
            )
    )
) with check (
    exists (
        select 1
        from public.ideas i
            join public.companies c on c.id = i.company_id
        where i.id = linkedin_content.idea_id
            and c.owner_id = (
                select auth.uid()
            )
    )
);
-- newsletter_content
drop policy if exists "Newsletter content via idea->company" on public.newsletter_content;
create policy "Newsletter content via idea->company" on public.newsletter_content for all to authenticated using (
    pg_trigger_depth() > 0
    or exists (
        select 1
        from public.ideas i
            join public.companies c on c.id = i.company_id
        where i.id = newsletter_content.idea_id
            and c.owner_id = (
                select auth.uid()
            )
    )
) with check (
    exists (
        select 1
        from public.ideas i
            join public.companies c on c.id = i.company_id
        where i.id = newsletter_content.idea_id
            and c.owner_id = (
                select auth.uid()
            )
    )
);
-- real_estate_content: allow delete when invoked by FK cascade or by owner
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
