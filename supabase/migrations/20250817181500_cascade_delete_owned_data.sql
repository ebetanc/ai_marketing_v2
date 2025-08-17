-- Purpose: When deleting a user, cascade delete all owned data.
-- This adjusts FK constraints to use ON DELETE CASCADE from auth.users
-- into public.companies and public.real_estate_content, and ensures
-- cascading deletes throughout the domain model hierarchy:
-- companies -> strategies -> ideas -> content tables, and
-- companies -> ideas directly as well.
-- Date: 2025-08-17
begin;
-- 1) Cascade from auth.users to owned tables
-- companies.owner_id -> auth.users(id)
alter table public.companies drop constraint if exists companies_owner_id_fkey;
alter table public.companies
add constraint companies_owner_id_fkey foreign key (owner_id) references auth.users(id) on delete cascade;
-- real_estate_content.owner_id -> auth.users(id)
alter table public.real_estate_content drop constraint if exists real_estate_content_owner_id_fkey;
alter table public.real_estate_content
add constraint real_estate_content_owner_id_fkey foreign key (owner_id) references auth.users(id) on delete cascade;
-- 2) Cascade from companies to dependent tables
-- strategies.company_id -> companies(id)
alter table public.strategies drop constraint if exists strategies_company_id_fkey;
alter table public.strategies
add constraint strategies_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade;
-- ideas.company_id -> companies(id)
alter table public.ideas drop constraint if exists ideas_company_id_fkey;
alter table public.ideas
add constraint ideas_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade;
-- 3) Cascade from strategies to ideas via ideas.strategy_id
alter table public.ideas drop constraint if exists ideas_strategy_id_fkey;
alter table public.ideas
add constraint ideas_strategy_id_fkey foreign key (strategy_id) references public.strategies(id) on delete cascade;
-- 4) Cascade from ideas to content tables
-- twitter_content.idea_id -> ideas(id)
alter table public.twitter_content drop constraint if exists twitter_content_idea_id_fkey;
alter table public.twitter_content
add constraint twitter_content_idea_id_fkey foreign key (idea_id) references public.ideas(id) on delete cascade;
-- linkedin_content.idea_id -> ideas(id)
alter table public.linkedin_content drop constraint if exists linkedin_content_idea_id_fkey;
alter table public.linkedin_content
add constraint linkedin_content_idea_id_fkey foreign key (idea_id) references public.ideas(id) on delete cascade;
-- newsletter_content.idea_id -> ideas(id)
alter table public.newsletter_content drop constraint if exists newsletter_content_idea_id_fkey;
alter table public.newsletter_content
add constraint newsletter_content_idea_id_fkey foreign key (idea_id) references public.ideas(id) on delete cascade;
commit;
