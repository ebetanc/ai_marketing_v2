-- Ensure content.status initializes from post on insert
-- Date: 2025-08-17
begin;
-- Generic trigger function to set status from post when not provided
create or replace function public.set_status_from_post() returns trigger language plpgsql as $$ begin -- Only set when status not explicitly provided
    if NEW.status is null then NEW.status := case
        when NEW.post is true then 'approved'
        else 'draft'
    end;
end if;
return NEW;
end;
$$;
-- Twitter content trigger
create trigger set_status_from_post_twitter before
insert on public.twitter_content for each row execute function public.set_status_from_post();
-- LinkedIn content trigger
create trigger set_status_from_post_linkedin before
insert on public.linkedin_content for each row execute function public.set_status_from_post();
-- Newsletter content trigger
create trigger set_status_from_post_newsletter before
insert on public.newsletter_content for each row execute function public.set_status_from_post();
commit;
