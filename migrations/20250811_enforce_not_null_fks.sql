-- Date: 2025-08-11
-- Purpose: Enforce NOT NULL on foreign key columns after verifying no nulls exist.
begin;
-- 1. Ensure no nulls exist before altering columns (abort if any found)
do $$
declare n int;
begin
select count(*) into n
from strategies
where company_id is null;
if n > 0 then raise exception 'Cannot set NOT NULL: strategies.company_id has % nulls',
n;
end if;
end $$;
do $$
declare n int;
begin
select count(*) into n
from ideas
where company_id is null;
if n > 0 then raise exception 'Cannot set NOT NULL: ideas.company_id has % nulls',
n;
end if;
end $$;
do $$
declare n int;
begin
select count(*) into n
from ideas
where strategy_id is null;
if n > 0 then raise exception 'Cannot set NOT NULL: ideas.strategy_id has % nulls',
n;
end if;
end $$;
-- 2. Alter columns to set NOT NULL (idempotent)
alter table strategies
alter column company_id
set not null;
alter table ideas
alter column company_id
set not null;
alter table ideas
alter column strategy_id
set not null;
commit;
