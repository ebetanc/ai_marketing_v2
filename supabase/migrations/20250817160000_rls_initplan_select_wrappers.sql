-- Purpose: Fix linter 0003_auth_rls_initplan by wrapping auth.* calls in RLS policies
--          with SELECT so they're evaluated once per statement, not per row.
-- Date: 2025-08-17
begin;
-- public.companies
drop policy if exists "Companies select own" on public.companies;
create policy "Companies select own" on public.companies for
select to authenticated using (
        owner_id is not null
        and owner_id = (
            select auth.uid()
        )
    );
drop policy if exists "Companies insert own" on public.companies;
create policy "Companies insert own" on public.companies for
insert to authenticated with check (
        owner_id is not null
        and owner_id = (
            select auth.uid()
        )
    );
drop policy if exists "Companies update own" on public.companies;
create policy "Companies update own" on public.companies for
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
drop policy if exists "Companies delete own" on public.companies;
create policy "Companies delete own" on public.companies for delete to authenticated using (
    owner_id is not null
    and owner_id = (
        select auth.uid()
    )
);
-- public.ideas
drop policy if exists "Ideas via company" on public.ideas;
create policy "Ideas via company" on public.ideas for all to authenticated using (
    exists (
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
-- public.strategies
drop policy if exists "Strategies via company" on public.strategies;
create policy "Strategies via company" on public.strategies for all to authenticated using (
    exists (
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
-- public.twitter_content
drop policy if exists "Twitter content via idea->company" on public.twitter_content;
create policy "Twitter content via idea->company" on public.twitter_content for all to authenticated using (
    exists (
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
-- public.linkedin_content
drop policy if exists "LinkedIn content via idea->company" on public.linkedin_content;
create policy "LinkedIn content via idea->company" on public.linkedin_content for all to authenticated using (
    exists (
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
-- public.newsletter_content
drop policy if exists "Newsletter content via idea->company" on public.newsletter_content;
create policy "Newsletter content via idea->company" on public.newsletter_content for all to authenticated using (
    exists (
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
-- public.real_estate_content
drop policy if exists "Real estate select own" on public.real_estate_content;
create policy "Real estate select own" on public.real_estate_content for
select to authenticated using (
        owner_id is not null
        and owner_id = (
            select auth.uid()
        )
    );
drop policy if exists "Real estate insert own" on public.real_estate_content;
create policy "Real estate insert own" on public.real_estate_content for
insert to authenticated with check (
        owner_id is not null
        and owner_id = (
            select auth.uid()
        )
    );
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
drop policy if exists "Real estate delete own" on public.real_estate_content;
create policy "Real estate delete own" on public.real_estate_content for delete to authenticated using (
    owner_id is not null
    and owner_id = (
        select auth.uid()
    )
);
commit;
