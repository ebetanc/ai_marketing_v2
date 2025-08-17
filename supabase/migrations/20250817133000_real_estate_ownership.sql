-- Tie real_estate_content rows to the authenticated user via owner_id and strict RLS
-- Date: 2025-08-17
begin;
-- 1) Add owner_id with default to auth.uid() and FK to auth.users
alter table public.real_estate_content
add column if not exists owner_id uuid default auth.uid();
do $$ begin
alter table public.real_estate_content
add constraint real_estate_content_owner_id_fkey foreign key (owner_id) references auth.users(id) on delete restrict;
exception
when duplicate_object then null;
end $$;
create index if not exists real_estate_owner_idx on public.real_estate_content(owner_id);
-- Backfill existing NULL owner rows: if any auth.users exist, set to one of them; otherwise leave NULL
do $$
begin
    if exists (select 1 from auth.users) then
        update public.real_estate_content
        set owner_id = (
    select id from auth.users limit 1
        )
        where owner_id is null;
    end if;
end
$$;
-- Optionally enforce NOT NULL only if no NULLs remain
do $$ begin if not exists (
    select 1
    from public.real_estate_content
    where owner_id is null
) then execute 'alter table public.real_estate_content alter column owner_id set not null';
end if;
end $$;
-- 2) Replace broad authenticated policies with owner-scoped policies
drop policy if exists "Auth read" on public.real_estate_content;
drop policy if exists "Auth insert" on public.real_estate_content;
drop policy if exists "Auth update" on public.real_estate_content;
drop policy if exists "Auth delete" on public.real_estate_content;
create policy "Real estate select own" on public.real_estate_content for
select to authenticated using (
        owner_id is not null
        and owner_id = auth.uid()
    );
create policy "Real estate insert own" on public.real_estate_content for
insert to authenticated with check (
        owner_id is not null
        and owner_id = auth.uid()
    );
create policy "Real estate update own" on public.real_estate_content for
update to authenticated using (
        owner_id is not null
        and owner_id = auth.uid()
    ) with check (
        owner_id is not null
        and owner_id = auth.uid()
    );
create policy "Real estate delete own" on public.real_estate_content for delete to authenticated using (
    owner_id is not null
    and owner_id = auth.uid()
);
commit;
