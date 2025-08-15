-- Lock down RLS policies to authenticated-only and revoke anon grants (minimal defaults)
-- Date: 2025-08-15
begin;
-- Drop permissive policies created in baseline
-- ideas
drop policy if exists "Enable read access for all" on public.ideas;
drop policy if exists "Enable read access for all users for update" on public.ideas;
-- companies
drop policy if exists "Enable read access for all users" on public.companies;
drop policy if exists "Enable read access for all users update" on public.companies;
-- was DELETE
-- strategies
drop policy if exists "Enable read access for all users" on public.strategies;
drop policy if exists "Enable update access for all users" on public.strategies;
-- twitter_content
drop policy if exists "Enable read access for all users" on public.twitter_content;
drop policy if exists "Enable read access for all users update" on public.twitter_content;
-- linkedin_content
drop policy if exists "Enable read access for all users" on public.linkedin_content;
drop policy if exists "Enable read access for all users UPDATE" on public.linkedin_content;
-- newsletter_content
drop policy if exists "Enable read access for all users" on public.newsletter_content;
drop policy if exists "Enable read access for all users UPDATE" on public.newsletter_content;
-- real_estate_content
drop policy if exists "Enable read access for all users" on public.real_estate_content;
drop policy if exists "Enable read access for all users update" on public.real_estate_content;
-- Create minimal authenticated-only policies
-- Helper: create a function to apply common policies (not necessary; write explicitly for clarity)
-- ideas
create policy "Auth read" on public.ideas for
select to authenticated using (true);
create policy "Auth insert" on public.ideas for
insert to authenticated with check (true);
create policy "Auth update" on public.ideas for
update to authenticated using (true) with check (true);
create policy "Auth delete" on public.ideas for delete to authenticated using (true);
-- companies
create policy "Auth read" on public.companies for
select to authenticated using (true);
create policy "Auth insert" on public.companies for
insert to authenticated with check (true);
create policy "Auth update" on public.companies for
update to authenticated using (true) with check (true);
create policy "Auth delete" on public.companies for delete to authenticated using (true);
-- strategies
create policy "Auth read" on public.strategies for
select to authenticated using (true);
create policy "Auth insert" on public.strategies for
insert to authenticated with check (true);
create policy "Auth update" on public.strategies for
update to authenticated using (true) with check (true);
create policy "Auth delete" on public.strategies for delete to authenticated using (true);
-- twitter_content
create policy "Auth read" on public.twitter_content for
select to authenticated using (true);
create policy "Auth insert" on public.twitter_content for
insert to authenticated with check (true);
create policy "Auth update" on public.twitter_content for
update to authenticated using (true) with check (true);
create policy "Auth delete" on public.twitter_content for delete to authenticated using (true);
-- linkedin_content
create policy "Auth read" on public.linkedin_content for
select to authenticated using (true);
create policy "Auth insert" on public.linkedin_content for
insert to authenticated with check (true);
create policy "Auth update" on public.linkedin_content for
update to authenticated using (true) with check (true);
create policy "Auth delete" on public.linkedin_content for delete to authenticated using (true);
-- newsletter_content
create policy "Auth read" on public.newsletter_content for
select to authenticated using (true);
create policy "Auth insert" on public.newsletter_content for
insert to authenticated with check (true);
create policy "Auth update" on public.newsletter_content for
update to authenticated using (true) with check (true);
create policy "Auth delete" on public.newsletter_content for delete to authenticated using (true);
-- real_estate_content
create policy "Auth read" on public.real_estate_content for
select to authenticated using (true);
create policy "Auth insert" on public.real_estate_content for
insert to authenticated with check (true);
create policy "Auth update" on public.real_estate_content for
update to authenticated using (true) with check (true);
create policy "Auth delete" on public.real_estate_content for delete to authenticated using (true);
-- Revoke anon grants on tables and sequences; RLS + authenticated policies will govern access
revoke all on table public.companies
from anon;
revoke all on table public.strategies
from anon;
revoke all on table public.ideas
from anon;
revoke all on table public.twitter_content
from anon;
revoke all on table public.linkedin_content
from anon;
revoke all on table public.newsletter_content
from anon;
revoke all on table public.real_estate_content
from anon;
revoke all on sequence public.companies_id_seq
from anon;
revoke all on sequence public.content_id_seq
from anon;
revoke all on sequence public.ideas_id_seq
from anon;
revoke all on sequence public.linkedin_content_id_seq
from anon;
revoke all on sequence public.newsletter_content_id_seq
from anon;
revoke all on sequence public.strategies_id_seq
from anon;
commit;
