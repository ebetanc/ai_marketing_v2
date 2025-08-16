-- Cleanest approach: no trigger. Enforce DEFAULT auth.uid() and (safely) NOT NULL.
-- Also remove any legacy trigger/function if they exist.
begin;
-- Ensure the default is set (idempotent)
alter table public.companies
alter column owner_id
set default auth.uid();
-- Conditionally enforce NOT NULL only if there are no NULLs to avoid migration failure.
do $$ begin if not exists (
    select 1
    from public.companies
    where owner_id is null
) then execute 'alter table public.companies alter column owner_id set not null';
else raise notice 'companies.owner_id has NULLs; NOT NULL not applied. Backfill and rerun if strictness is required.';
end if;
end $$;
