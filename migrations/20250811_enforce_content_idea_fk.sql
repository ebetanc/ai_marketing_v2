-- Date: 2025-08-11
-- Purpose: Ensure all content rows are linked to parent ideas via idea_id (3NF parent linkage).
-- Actions:
--  - Ensure idea_id exists as bigint
--  - Recreate FKs to ideas(id) with ON DELETE CASCADE
--  - Enforce NOT NULL on idea_id after verifying no nulls remain
--  - Create helpful indexes (idempotent)
begin;
-- Helper function pattern per table
-- twitter_content: ensure column
do $$ begin if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'twitter_content'
        and column_name = 'idea_id'
) then
alter table twitter_content
add column idea_id bigint;
end if;
end $$;
-- linkedin_content: ensure column
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
end $$;
-- newsletter_content: ensure column
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
end $$;
-- Recreate FK constraints with ON DELETE CASCADE (drop if they exist with different actions)
-- twitter_content
do $$ begin if exists (
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
do $$ begin if exists (
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
do $$ begin if exists (
    select 1
    from pg_constraint
    where conname = 'newsletter_content_idea_id_fkey'
) then
alter table newsletter_content drop constraint newsletter_content_idea_id_fkey;
end if;
alter table newsletter_content
add constraint newsletter_content_idea_id_fkey foreign key (idea_id) references ideas(id) on delete cascade;
end $$;
-- Enforce NOT NULL only when safe (abort if any nulls)
-- twitter_content
DO $$
DECLARE n int;
BEGIN
SELECT count(*) INTO n
FROM twitter_content
WHERE idea_id IS NULL;
IF n > 0 THEN RAISE EXCEPTION 'Cannot set NOT NULL: twitter_content.idea_id has % nulls',
n;
END IF;
ALTER TABLE twitter_content
ALTER COLUMN idea_id
SET NOT NULL;
END $$;
-- linkedin_content
DO $$
DECLARE n int;
BEGIN
SELECT count(*) INTO n
FROM linkedin_content
WHERE idea_id IS NULL;
IF n > 0 THEN RAISE EXCEPTION 'Cannot set NOT NULL: linkedin_content.idea_id has % nulls',
n;
END IF;
ALTER TABLE linkedin_content
ALTER COLUMN idea_id
SET NOT NULL;
END $$;
-- newsletter_content
DO $$
DECLARE n int;
BEGIN
SELECT count(*) INTO n
FROM newsletter_content
WHERE idea_id IS NULL;
IF n > 0 THEN RAISE EXCEPTION 'Cannot set NOT NULL: newsletter_content.idea_id has % nulls',
n;
END IF;
ALTER TABLE newsletter_content
ALTER COLUMN idea_id
SET NOT NULL;
END $$;
-- Helpful indexes (idempotent)
create index if not exists idx_twitter_content_idea_id on twitter_content(idea_id);
create index if not exists idx_linkedin_content_idea_id on linkedin_content(idea_id);
create index if not exists idx_newsletter_content_idea_id on newsletter_content(idea_id);
commit;
