-- Adds an index to speed up owner-scoped queries and RLS checks on companies
-- Safe to re-run: guarded by existence check

do $$
begin
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'i'
      and c.relname = 'companies_owner_idx'
      and n.nspname = 'public'
  ) then
    create index companies_owner_idx on public.companies(owner_id);
  end if;
end
$$;
-- Add index on companies.owner_id to improve RLS performance and common filters
create index if not exists companies_owner_idx on public.companies(owner_id);
