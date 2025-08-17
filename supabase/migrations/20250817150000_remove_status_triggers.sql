-- Remove content status-on-insert triggers and function; rely on DEFAULT 'draft'
-- Date: 2025-08-17
begin;
-- Drop triggers if they exist
drop trigger if exists set_status_from_post_twitter on public.twitter_content;
drop trigger if exists set_status_from_post_linkedin on public.linkedin_content;
drop trigger if exists set_status_from_post_newsletter on public.newsletter_content;
-- Drop the function if no longer used
drop function if exists public.set_status_from_post();
commit;
