-- Add stable topic linkage columns to content
-- Date: 2025-08-30
begin;
-- 1) Add columns if not exist
alter table public.content
add column if not exists topic_number int,
  add column if not exists generation_run_id uuid;
-- 2) Backfill topic_number for recent rows if we can infer from pattern (optional noop here)
-- (Left empty intentionally; app will start writing topic_number for new generations.)
-- 3) Unique constraint to prevent duplicates per platform per topic
-- Use a partial to avoid legacy rows without topic_number
create unique index if not exists content_unique_topic_platform on public.content(idea_id, topic_number, platform)
where topic_number is not null;
commit;
