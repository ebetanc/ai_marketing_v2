-- Create a minimal profiles table linked to auth.users with a role column
-- Avoids redundant user data (email, etc. live in auth.users / metadata)
-- Date: 2025-08-18
begin;
-- Create enum for role (idempotent)
do $$ begin create type public.user_role as enum ('user', 'admin');
exception
when duplicate_object then null;
end $$;
-- Create profiles table (id = auth.users.id)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    role public.user_role not null default 'user',
    created_at timestamptz not null default now()
);
-- RLS: only the user may access/modify their own profile row
alter table public.profiles enable row level security;
-- Drop any existing policies to make this idempotent
drop policy if exists "Profiles select own" on public.profiles;
drop policy if exists "Profiles insert own" on public.profiles;
drop policy if exists "Profiles update own" on public.profiles;
drop policy if exists "Profiles delete own" on public.profiles;
-- Use SELECT wrapper for auth.uid() per RLS initplan best practices
create policy "Profiles select own" on public.profiles for
select to authenticated using (
        id = (
            select auth.uid()
        )
    );
create policy "Profiles insert own" on public.profiles for
insert to authenticated with check (
        id = (
            select auth.uid()
        )
    );
create policy "Profiles update own" on public.profiles for
update to authenticated using (
        id = (
            select auth.uid()
        )
    ) with check (
        id = (
            select auth.uid()
        )
    );
create policy "Profiles delete own" on public.profiles for delete to authenticated using (
    id = (
        select auth.uid()
    )
);
commit;
