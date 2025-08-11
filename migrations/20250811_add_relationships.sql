-- Date: 2025-08-11
begin;
-- 1) Ensure column types match referenced primary keys (clean fix for prior uuid mismatch)
-- If columns exist with the wrong type, drop and recreate them as bigint.
do $$ begin -- strategies.company_id should be bigint to match companies.id (bigint)
if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'strategies'
        and column_name = 'company_id'
        and data_type <> 'bigint'
) then
alter table strategies drop column company_id;
end if;
-- ideas.company_id should be bigint to match companies.id (bigint)
if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'ideas'
        and column_name = 'company_id'
        and data_type <> 'bigint'
) then
alter table ideas drop column company_id;
end if;
-- ideas.strategy_id should be bigint to match strategies.id (assumed bigint)
if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'ideas'
        and column_name = 'strategy_id'
        and data_type <> 'bigint'
) then
alter table ideas drop column strategy_id;
end if;
end $$;
-- (Re)add columns with the correct type if missing
alter table if exists strategies
add column if not exists company_id bigint;
alter table if exists ideas
add column if not exists strategy_id bigint;
alter table if exists ideas
add column if not exists company_id bigint;
-- 2) Add foreign keys (idempotent pattern using constraint names)
-- Strategies -> Companies
do $$ begin if not exists (
    select 1
    from pg_constraint
    where conname = 'strategies_company_id_fkey'
) then
alter table strategies
add constraint strategies_company_id_fkey foreign key (company_id) references companies(id) on delete cascade;
end if;
end $$;
-- Ideas -> Strategies
do $$ begin if not exists (
    select 1
    from pg_constraint
    where conname = 'ideas_strategy_id_fkey'
) then
alter table ideas
add constraint ideas_strategy_id_fkey foreign key (strategy_id) references strategies(id) on delete cascade;
end if;
end $$;
-- Ideas -> Companies
do $$ begin if not exists (
    select 1
    from pg_constraint
    where conname = 'ideas_company_id_fkey'
) then
alter table ideas
add constraint ideas_company_id_fkey foreign key (company_id) references companies(id) on delete cascade;
end if;
end $$;
-- 3) Backfill IDs from brand strings (case-insensitive)
-- Only fill rows that are currently null
update strategies s
set company_id = c.id
from companies c
where s.company_id is null
    and s.brand is not null
    and lower(c.brand_name) = lower(s.brand);
update ideas i
set company_id = c.id
from companies c
where i.company_id is null
    and i.brand is not null
    and lower(c.brand_name) = lower(i.brand);
-- 4) Helpful indexes
create index if not exists idx_strategies_company_id on strategies(company_id);
create index if not exists idx_ideas_strategy_id on ideas(strategy_id);
create index if not exists idx_ideas_company_id on ideas(company_id);
-- 5) Optional: enforce not-null after verifying data (commented out)
-- alter table strategies alter column company_id set not null;
-- alter table ideas alter column strategy_id set not null;
commit;
