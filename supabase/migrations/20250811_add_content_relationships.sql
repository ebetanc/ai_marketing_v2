-- Date: 2025-08-11
-- Purpose: Ensure content tables link to parent tables via FKs: company_id -> companies(id),
--          optional strategy_id -> strategies(id), optional idea_id -> ideas(id).
--          Add columns if missing, coerce types to bigint when needed, and add helpful indexes.
begin;
-- Helper DO block to drop a column if it exists with wrong type and then ensure it exists as bigint
-- Usage pattern repeated for each table/column
-- twitter_content
do $$ begin -- company_id should be bigint
if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'twitter_content'
        and column_name = 'company_id'
        and data_type <> 'bigint'
) then
alter table twitter_content drop column company_id;
end if;
-- strategy_id should be bigint
if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'twitter_content'
        and column_name = 'strategy_id'
        and data_type <> 'bigint'
) then
alter table twitter_content drop column strategy_id;
end if;
-- idea_id should be bigint
if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'twitter_content'
        and column_name = 'idea_id'
        and data_type <> 'bigint'
) then
alter table twitter_content drop column idea_id;
end if;
end $$;
alter table if exists twitter_content
add column if not exists company_id bigint;
alter table if exists twitter_content
add column if not exists strategy_id bigint;
alter table if exists twitter_content
add column if not exists idea_id bigint;
-- linkedin_content
do $$ begin if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'linkedin_content'
        and column_name = 'company_id'
        and data_type <> 'bigint'
) then
alter table linkedin_content drop column company_id;
end if;
if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'linkedin_content'
        and column_name = 'strategy_id'
        and data_type <> 'bigint'
) then
alter table linkedin_content drop column strategy_id;
end if;
if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'linkedin_content'
        and column_name = 'idea_id'
        and data_type <> 'bigint'
) then
alter table linkedin_content drop column idea_id;
end if;
end $$;
alter table if exists linkedin_content
add column if not exists company_id bigint;
alter table if exists linkedin_content
add column if not exists strategy_id bigint;
alter table if exists linkedin_content
add column if not exists idea_id bigint;
-- newsletter_content
do $$ begin if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'newsletter_content'
        and column_name = 'company_id'
        and data_type <> 'bigint'
) then
alter table newsletter_content drop column company_id;
end if;
if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'newsletter_content'
        and column_name = 'strategy_id'
        and data_type <> 'bigint'
) then
alter table newsletter_content drop column strategy_id;
end if;
if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'newsletter_content'
        and column_name = 'idea_id'
        and data_type <> 'bigint'
) then
alter table newsletter_content drop column idea_id;
end if;
end $$;
alter table if exists newsletter_content
add column if not exists company_id bigint;
alter table if exists newsletter_content
add column if not exists strategy_id bigint;
alter table if exists newsletter_content
add column if not exists idea_id bigint;
-- Add foreign keys idempotently
do $$ begin if not exists (
    select 1
    from pg_constraint
    where conname = 'twitter_content_company_id_fkey'
) then
alter table twitter_content
add constraint twitter_content_company_id_fkey foreign key (company_id) references companies(id) on delete cascade;
end if;
if not exists (
    select 1
    from pg_constraint
    where conname = 'twitter_content_strategy_id_fkey'
) then
alter table twitter_content
add constraint twitter_content_strategy_id_fkey foreign key (strategy_id) references strategies(id) on delete cascade;
end if;
if not exists (
    select 1
    from pg_constraint
    where conname = 'twitter_content_idea_id_fkey'
) then
alter table twitter_content
add constraint twitter_content_idea_id_fkey foreign key (idea_id) references ideas(id) on delete
set null;
end if;
end $$;
do $$ begin if not exists (
    select 1
    from pg_constraint
    where conname = 'linkedin_content_company_id_fkey'
) then
alter table linkedin_content
add constraint linkedin_content_company_id_fkey foreign key (company_id) references companies(id) on delete cascade;
end if;
if not exists (
    select 1
    from pg_constraint
    where conname = 'linkedin_content_strategy_id_fkey'
) then
alter table linkedin_content
add constraint linkedin_content_strategy_id_fkey foreign key (strategy_id) references strategies(id) on delete cascade;
end if;
if not exists (
    select 1
    from pg_constraint
    where conname = 'linkedin_content_idea_id_fkey'
) then
alter table linkedin_content
add constraint linkedin_content_idea_id_fkey foreign key (idea_id) references ideas(id) on delete
set null;
end if;
end $$;
do $$ begin if not exists (
    select 1
    from pg_constraint
    where conname = 'newsletter_content_company_id_fkey'
) then
alter table newsletter_content
add constraint newsletter_content_company_id_fkey foreign key (company_id) references companies(id) on delete cascade;
end if;
if not exists (
    select 1
    from pg_constraint
    where conname = 'newsletter_content_strategy_id_fkey'
) then
alter table newsletter_content
add constraint newsletter_content_strategy_id_fkey foreign key (strategy_id) references strategies(id) on delete cascade;
end if;
if not exists (
    select 1
    from pg_constraint
    where conname = 'newsletter_content_idea_id_fkey'
) then
alter table newsletter_content
add constraint newsletter_content_idea_id_fkey foreign key (idea_id) references ideas(id) on delete
set null;
end if;
end $$;
-- Backfill company_id from brand_name/brand where those columns exist (avoid referencing non-existent columns)
do $$
declare has_brand_name boolean;
has_brand boolean;
begin
select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
            and table_name = 'twitter_content'
            and column_name = 'brand_name'
    ) into has_brand_name;
select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
            and table_name = 'twitter_content'
            and column_name = 'brand'
    ) into has_brand;
if has_brand_name then
update twitter_content t
set company_id = c.id
from companies c
where t.company_id is null
    and t.brand_name is not null
    and lower(t.brand_name) = lower(c.brand_name);
end if;
if has_brand then
update twitter_content t
set company_id = c.id
from companies c
where t.company_id is null
    and t.brand is not null
    and lower(t.brand) = lower(c.brand_name);
end if;
end $$;
do $$
declare has_brand_name boolean;
has_brand boolean;
begin
select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
            and table_name = 'linkedin_content'
            and column_name = 'brand_name'
    ) into has_brand_name;
select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
            and table_name = 'linkedin_content'
            and column_name = 'brand'
    ) into has_brand;
if has_brand_name then
update linkedin_content t
set company_id = c.id
from companies c
where t.company_id is null
    and t.brand_name is not null
    and lower(t.brand_name) = lower(c.brand_name);
end if;
if has_brand then
update linkedin_content t
set company_id = c.id
from companies c
where t.company_id is null
    and t.brand is not null
    and lower(t.brand) = lower(c.brand_name);
end if;
end $$;
do $$
declare has_brand_name boolean;
has_brand boolean;
begin
select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
            and table_name = 'newsletter_content'
            and column_name = 'brand_name'
    ) into has_brand_name;
select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
            and table_name = 'newsletter_content'
            and column_name = 'brand'
    ) into has_brand;
if has_brand_name then
update newsletter_content t
set company_id = c.id
from companies c
where t.company_id is null
    and t.brand_name is not null
    and lower(t.brand_name) = lower(c.brand_name);
end if;
if has_brand then
update newsletter_content t
set company_id = c.id
from companies c
where t.company_id is null
    and t.brand is not null
    and lower(t.brand) = lower(c.brand_name);
end if;
end $$;
-- Helpful indexes
create index if not exists idx_twitter_content_company_id on twitter_content(company_id);
create index if not exists idx_twitter_content_strategy_id on twitter_content(strategy_id);
create index if not exists idx_twitter_content_idea_id on twitter_content(idea_id);
create index if not exists idx_linkedin_content_company_id on linkedin_content(company_id);
create index if not exists idx_linkedin_content_strategy_id on linkedin_content(strategy_id);
create index if not exists idx_linkedin_content_idea_id on linkedin_content(idea_id);
create index if not exists idx_newsletter_content_company_id on newsletter_content(company_id);
create index if not exists idx_newsletter_content_strategy_id on newsletter_content(strategy_id);
create index if not exists idx_newsletter_content_idea_id on newsletter_content(idea_id);
commit;
