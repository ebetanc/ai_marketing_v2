-- Date: 2025-08-11
-- Purpose: Ensure brand→company backfill is complete and enforce it going forward.
-- Safe/idempotent: re-runs backfill and only adds constraints if missing.
begin;
-- Re-run backfill to be safe (idempotent)
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
-- Assert there are no remaining rows with a brand but missing company_id
do $$
declare missing_count int;
begin
select count(*) into missing_count
from strategies s
where s.brand is not null
    and s.company_id is null;
if missing_count > 0 then raise exception 'Backfill incomplete: % strategies have brand but null company_id',
missing_count;
end if;
end $$;
do $$
declare missing_count int;
begin
select count(*) into missing_count
from ideas i
where i.brand is not null
    and i.company_id is null;
if missing_count > 0 then raise exception 'Backfill incomplete: % ideas have brand but null company_id',
missing_count;
end if;
end $$;
-- Add CHECK constraints to codify the rule (brand present => company_id present)
do $$ begin if not exists (
    select 1
    from pg_constraint
    where conname = 'strategies_company_id_backfill_chk'
) then
alter table strategies
add constraint strategies_company_id_backfill_chk check (
        brand is null
        or company_id is not null
    ) not valid;
alter table strategies validate constraint strategies_company_id_backfill_chk;
end if;
end $$;
do $$ begin if not exists (
    select 1
    from pg_constraint
    where conname = 'ideas_company_id_backfill_chk'
) then
alter table ideas
add constraint ideas_company_id_backfill_chk check (
        brand is null
        or company_id is not null
    ) not valid;
alter table ideas validate constraint ideas_company_id_backfill_chk;
end if;
end $$;
commit;
