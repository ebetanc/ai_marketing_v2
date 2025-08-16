-- Purpose: Introduce row ownership (companies.owner_id), tighten RLS to per-owner access,
-- add integrity constraints (PK/defaults), and harden privileges.
-- Date: 2025-08-16
begin;
-- 1) Ownership: add owner_id to companies and reference auth.users
alter table public.companies
add column if not exists owner_id uuid default auth.uid();
do $$ begin
alter table public.companies
add constraint companies_owner_id_fkey foreign key (owner_id) references auth.users(id) on delete restrict;
exception
when duplicate_object then null;
end $$;
-- Optional per-tenant uniqueness on brand_name (case-insensitive)
create unique index if not exists companies_owner_brand_unq on public.companies (owner_id, lower(brand_name));
-- 2) Replace broad authenticated policies with owner-scoped policies
-- Drop any existing policies created previously
-- companies
drop policy if exists "Auth read" on public.companies;
drop policy if exists "Auth insert" on public.companies;
drop policy if exists "Auth update" on public.companies;
drop policy if exists "Auth delete" on public.companies;
create policy "Companies select own" on public.companies for
select to authenticated using (
        owner_id is not null
        and owner_id = auth.uid()
    );
create policy "Companies insert own" on public.companies for
insert to authenticated with check (
        owner_id is not null
        and owner_id = auth.uid()
    );
create policy "Companies update own" on public.companies for
update to authenticated using (
        owner_id is not null
        and owner_id = auth.uid()
    ) with check (
        owner_id is not null
        and owner_id = auth.uid()
    );
create policy "Companies delete own" on public.companies for delete to authenticated using (
    owner_id is not null
    and owner_id = auth.uid()
);
-- ideas
drop policy if exists "Auth read" on public.ideas;
drop policy if exists "Auth insert" on public.ideas;
drop policy if exists "Auth update" on public.ideas;
drop policy if exists "Auth delete" on public.ideas;
create policy "Ideas via company" on public.ideas for all to authenticated using (
    exists (
        select 1
        from public.companies c
        where c.id = ideas.company_id
            and c.owner_id = auth.uid()
    )
) with check (
    exists (
        select 1
        from public.companies c
        where c.id = ideas.company_id
            and c.owner_id = auth.uid()
    )
);
-- strategies
drop policy if exists "Auth read" on public.strategies;
drop policy if exists "Auth insert" on public.strategies;
drop policy if exists "Auth update" on public.strategies;
drop policy if exists "Auth delete" on public.strategies;
create policy "Strategies via company" on public.strategies for all to authenticated using (
    exists (
        select 1
        from public.companies c
        where c.id = strategies.company_id
            and c.owner_id = auth.uid()
    )
) with check (
    exists (
        select 1
        from public.companies c
        where c.id = strategies.company_id
            and c.owner_id = auth.uid()
    )
);
-- twitter_content
drop policy if exists "Auth read" on public.twitter_content;
drop policy if exists "Auth insert" on public.twitter_content;
drop policy if exists "Auth update" on public.twitter_content;
drop policy if exists "Auth delete" on public.twitter_content;
create policy "Twitter content via idea->company" on public.twitter_content for all to authenticated using (
    exists (
        select 1
        from public.ideas i
            join public.companies c on c.id = i.company_id
        where i.id = twitter_content.idea_id
            and c.owner_id = auth.uid()
    )
) with check (
    exists (
        select 1
        from public.ideas i
            join public.companies c on c.id = i.company_id
        where i.id = twitter_content.idea_id
            and c.owner_id = auth.uid()
    )
);
-- linkedin_content
drop policy if exists "Auth read" on public.linkedin_content;
drop policy if exists "Auth insert" on public.linkedin_content;
drop policy if exists "Auth update" on public.linkedin_content;
drop policy if exists "Auth delete" on public.linkedin_content;
create policy "LinkedIn content via idea->company" on public.linkedin_content for all to authenticated using (
    exists (
        select 1
        from public.ideas i
            join public.companies c on c.id = i.company_id
        where i.id = linkedin_content.idea_id
            and c.owner_id = auth.uid()
    )
) with check (
    exists (
        select 1
        from public.ideas i
            join public.companies c on c.id = i.company_id
        where i.id = linkedin_content.idea_id
            and c.owner_id = auth.uid()
    )
);
-- newsletter_content
drop policy if exists "Auth read" on public.newsletter_content;
drop policy if exists "Auth insert" on public.newsletter_content;
drop policy if exists "Auth update" on public.newsletter_content;
drop policy if exists "Auth delete" on public.newsletter_content;
create policy "Newsletter content via idea->company" on public.newsletter_content for all to authenticated using (
    exists (
        select 1
        from public.ideas i
            join public.companies c on c.id = i.company_id
        where i.id = newsletter_content.idea_id
            and c.owner_id = auth.uid()
    )
) with check (
    exists (
        select 1
        from public.ideas i
            join public.companies c on c.id = i.company_id
        where i.id = newsletter_content.idea_id
            and c.owner_id = auth.uid()
    )
);
-- real_estate_content: keep authenticated full access (no ownership model)
drop policy if exists "Auth read" on public.real_estate_content;
drop policy if exists "Auth insert" on public.real_estate_content;
drop policy if exists "Auth update" on public.real_estate_content;
drop policy if exists "Auth delete" on public.real_estate_content;
create policy "Auth read" on public.real_estate_content for
select to authenticated using (true);
create policy "Auth insert" on public.real_estate_content for
insert to authenticated with check (true);
create policy "Auth update" on public.real_estate_content for
update to authenticated using (true) with check (true);
create policy "Auth delete" on public.real_estate_content for delete to authenticated using (true);
-- 3) Tighten sequences: revoke unnecessary privileges from anon/authenticated
-- (safe to re-run)
revoke all on sequence public.companies_id_seq
from authenticated,
    anon;
revoke all on sequence public.content_id_seq
from authenticated,
    anon;
revoke all on sequence public.ideas_id_seq
from authenticated,
    anon;
revoke all on sequence public.linkedin_content_id_seq
from authenticated,
    anon;
revoke all on sequence public.newsletter_content_id_seq
from authenticated,
    anon;
revoke all on sequence public.strategies_id_seq
from authenticated,
    anon;
-- 4) Integrity fixes
-- real_estate_content: ensure PK on id and created_at default
-- Create sequence if needed and attach default to id
do $$ begin if not exists (
    select 1
    from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'S'
        and c.relname = 'real_estate_content_id_seq'
        and n.nspname = 'public'
) then execute 'create sequence public.real_estate_content_id_seq';
end if;
end $$;
-- attach default to use the sequence
alter table public.real_estate_content
alter column id
set default nextval('public.real_estate_content_id_seq');
-- backfill any null IDs
update public.real_estate_content
set id = nextval('public.real_estate_content_id_seq')
where id is null;
-- enforce not null and PK
alter table public.real_estate_content
alter column id
set not null;
do $$ begin
alter table public.real_estate_content
add constraint real_estate_content_pkey primary key (id);
exception
when duplicate_object then null;
end $$;
-- ensure created_at default and not null
alter table public.real_estate_content
alter column created_at
set default now();
update public.real_estate_content
set created_at = now()
where created_at is null;
alter table public.real_estate_content
alter column created_at
set not null;
-- content tables: enforce content_body not null (backfill empties)
update public.twitter_content
set content_body = ''
where content_body is null;
alter table public.twitter_content
alter column content_body
set not null;
update public.linkedin_content
set content_body = ''
where content_body is null;
alter table public.linkedin_content
alter column content_body
set not null;
update public.newsletter_content
set content_body = ''
where content_body is null;
alter table public.newsletter_content
alter column content_body
set not null;
-- 5) URL check and useful indexes
do $$ begin
alter table public.companies
add constraint companies_website_url_chk check (
        website is null
        or website ~* '^https?://'
    );
exception
when duplicate_object then null;
end $$;
create index if not exists ideas_created_at_idx on public.ideas (created_at desc);
create index if not exists twitter_created_at_idx on public.twitter_content (created_at desc);
create index if not exists linkedin_created_at_idx on public.linkedin_content (created_at desc);
create index if not exists newsletter_created_at_idx on public.newsletter_content (created_at desc);
commit;
