-- Add scheduling support to content
-- Date: 2025-08-18 12:30:00
begin;
alter table public.content
add column if not exists scheduled_at timestamptz null;
create index if not exists content_scheduled_at_idx on public.content (scheduled_at asc nulls last);
commit;
