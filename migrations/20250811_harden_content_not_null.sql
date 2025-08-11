-- Date: 2025-08-11
-- Purpose: Harden content tables by enforcing NOT NULL on company_id.
-- Safe pattern: aborts if any nulls exist; guarded if columns/tables are missing.

begin;

-- Helper: Enforce NOT NULL on a column only if it exists and has no nulls
-- Twitter Content
do $$
declare col_exists bool; null_count int;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'twitter_content' and column_name = 'company_id'
  ) into col_exists;
  if col_exists then
    select count(*) into null_count from twitter_content where company_id is null;
    if null_count > 0 then
      raise exception 'Cannot set NOT NULL: twitter_content.company_id has % nulls', null_count;
    end if;
    alter table twitter_content alter column company_id set not null;
  end if;
end $$;

-- LinkedIn Content
do $$
declare col_exists bool; null_count int;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'linkedin_content' and column_name = 'company_id'
  ) into col_exists;
  if col_exists then
    select count(*) into null_count from linkedin_content where company_id is null;
    if null_count > 0 then
      raise exception 'Cannot set NOT NULL: linkedin_content.company_id has % nulls', null_count;
    end if;
    alter table linkedin_content alter column company_id set not null;
  end if;
end $$;

-- Newsletter Content
do $$
declare col_exists bool; null_count int;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'newsletter_content' and column_name = 'company_id'
  ) into col_exists;
  if col_exists then
    select count(*) into null_count from newsletter_content where company_id is null;
    if null_count > 0 then
      raise exception 'Cannot set NOT NULL: newsletter_content.company_id has % nulls', null_count;
    end if;
    alter table newsletter_content alter column company_id set not null;
  end if;
end $$;

commit;
