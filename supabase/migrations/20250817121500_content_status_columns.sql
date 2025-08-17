-- Add status column to content tables to persist draft/approved state
-- Date: 2025-08-17
begin;
-- twitter_content
alter table public.twitter_content
add column if not exists status text;
update public.twitter_content
set status = coalesce(
        status,
        case
            when post = true then 'approved'
            else 'draft'
        end
    );
alter table public.twitter_content
alter column status
set default 'draft';
alter table public.twitter_content
alter column status
set not null;
create index if not exists twitter_status_idx on public.twitter_content (status);
-- linkedin_content
alter table public.linkedin_content
add column if not exists status text;
update public.linkedin_content
set status = coalesce(
        status,
        case
            when post = true then 'approved'
            else 'draft'
        end
    );
alter table public.linkedin_content
alter column status
set default 'draft';
alter table public.linkedin_content
alter column status
set not null;
create index if not exists linkedin_status_idx on public.linkedin_content (status);
-- newsletter_content
alter table public.newsletter_content
add column if not exists status text;
update public.newsletter_content
set status = coalesce(
        status,
        case
            when post = true then 'approved'
            else 'draft'
        end
    );
alter table public.newsletter_content
alter column status
set default 'draft';
alter table public.newsletter_content
alter column status
set not null;
create index if not exists newsletter_status_idx on public.newsletter_content (status);
commit;
