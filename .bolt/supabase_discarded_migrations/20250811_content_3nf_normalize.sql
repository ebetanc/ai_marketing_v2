-- Date: 2025-08-11
-- Purpose: Normalize content tables (twitter_content, linkedin_content, newsletter_content) to strict 3NF
-- by removing redundant company_id and strategy_id columns and relying solely on idea_id -> ideas(id).
-- Idempotent where possible; aborts if preconditions fail.
begin;
-- 0) Preconditions: Ensure idea_id exists as bigint and has a valid FK to ideas(id), then enforce NOT NULL
-- twitter_content
do $$ begin -- Ensure column exists with correct type
if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'twitter_content'
        and column_name = 'idea_id'
) then
alter table twitter_content
add column idea_id bigint;
end if;
-- Recreate FK to ON DELETE CASCADE
if exists (
    select 1
    from pg_constraint
    where conname = 'twitter_content_idea_id_fkey'
) then
alter table twitter_content drop constraint twitter_content_idea_id_fkey;
end if;
alter table twitter_content
add constraint twitter_content_idea_id_fkey foreign key (idea_id) references ideas(id) on delete cascade;
end $$;
-- linkedin_content
do $$ begin if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'linkedin_content'
        and column_name = 'idea_id'
) then
alter table linkedin_content
add column idea_id bigint;
end if;
if exists (
    select 1
    from pg_constraint
    where conname = 'linkedin_content_idea_id_fkey'
) then
alter table linkedin_content drop constraint linkedin_content_idea_id_fkey;
end if;
alter table linkedin_content
add constraint linkedin_content_idea_id_fkey foreign key (idea_id) references ideas(id) on delete cascade;
end $$;
-- newsletter_content
do $$ begin if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'newsletter_content'
        and column_name = 'idea_id'
) then
alter table newsletter_content
add column idea_id bigint;
end if;
if exists (
    select 1
    from pg_constraint
    where conname = 'newsletter_content_idea_id_fkey'
) then
alter table newsletter_content drop constraint newsletter_content_idea_id_fkey;
end if;
alter table newsletter_content
add constraint newsletter_content_idea_id_fkey foreign key (idea_id) references ideas(id) on delete cascade;
end $$;
-- Enforce NOT NULL on idea_id columns, but abort if any nulls remain
do $$
declare n int;
begin
select count(*) into n
from twitter_content
where idea_id is null;
if n > 0 then raise exception 'Cannot set NOT NULL: twitter_content.idea_id has % nulls',
n;
end if;
alter table twitter_content
alter column idea_id
set not null;
end $$;
do $$
declare n int;
begin
select count(*) into n
from linkedin_content
where idea_id is null;
if n > 0 then raise exception 'Cannot set NOT NULL: linkedin_content.idea_id has % nulls',
n;
end if;
alter table linkedin_content
alter column idea_id
set not null;
end $$;
do $$
declare n int;
begin
select count(*) into n
from newsletter_content
where idea_id is null;
if n > 0 then raise exception 'Cannot set NOT NULL: newsletter_content.idea_id has % nulls',
n;
end if;
alter table newsletter_content
alter column idea_id
set not null;
end $$;
-- 1) Drop redundant FKs and columns company_id and strategy_id from content tables (strict 3NF)
-- twitter_content
do $$ begin if exists (
    select 1
    from pg_constraint
    where conname = 'twitter_content_company_id_fkey'
) then
alter table twitter_content drop constraint twitter_content_company_id_fkey;
end if;
if exists (
    select 1
    from pg_constraint
    where conname = 'twitter_content_strategy_id_fkey'
) then
alter table twitter_content drop constraint twitter_content_strategy_id_fkey;
end if;
end $$;
-- Drop indexes if present
drop index if exists idx_twitter_content_company_id;
drop index if exists idx_twitter_content_strategy_id;
-- Drop columns if they exist
alter table if exists twitter_content drop column if exists company_id;
alter table if exists twitter_content drop column if exists strategy_id;
-- linkedin_content
do $$ begin if exists (
    select 1
    from pg_constraint
    where conname = 'linkedin_content_company_id_fkey'
) then
alter table linkedin_content drop constraint linkedin_content_company_id_fkey;
end if;
if exists (
    select 1
    from pg_constraint
    where conname = 'linkedin_content_strategy_id_fkey'
) then
alter table linkedin_content drop constraint linkedin_content_strategy_id_fkey;
end if;
end $$;
drop index if exists idx_linkedin_content_company_id;
drop index if exists idx_linkedin_content_strategy_id;
alter table if exists linkedin_content drop column if exists company_id;
alter table if exists linkedin_content drop column if exists strategy_id;
-- newsletter_content
do $$ begin if exists (
    select 1
    from pg_constraint
    where conname = 'newsletter_content_company_id_fkey'
) then
alter table newsletter_content drop constraint newsletter_content_company_id_fkey;
end if;
if exists (
    select 1
    from pg_constraint
    where conname = 'newsletter_content_strategy_id_fkey'
) then
alter table newsletter_content drop constraint newsletter_content_strategy_id_fkey;
end if;
end $$;
drop index if exists idx_newsletter_content_company_id;
drop index if exists idx_newsletter_content_strategy_id;
alter table if exists newsletter_content drop column if exists company_id;
alter table if exists newsletter_content drop column if exists strategy_id;
-- 2) Helpful indexes on idea_id (if not already created by prior migrations)
create index if not exists idx_twitter_content_idea_id on twitter_content(idea_id);
create index if not exists idx_linkedin_content_idea_id on linkedin_content(idea_id);
create index if not exists idx_newsletter_content_idea_id on newsletter_content(idea_id);
commit;
