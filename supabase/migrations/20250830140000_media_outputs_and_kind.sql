-- Add media-outputs bucket and differentiate input vs output assets via kind column
-- Date: 2025-08-30
-- 1) Create output bucket (idempotent)
insert into storage.buckets (id, name, public)
values ('media-outputs', 'media-outputs', false) on conflict (id) do nothing;
-- 2) Basic policies (authenticated CRUD) - can be hardened later similar to inputs
do $$ begin if not exists (
  select 1
  from pg_policies
  where policyname = 'Allow media output uploads'
) then create policy "Allow media output uploads" on storage.objects for
insert to authenticated with check (bucket_id = 'media-outputs');
end if;
end $$;
do $$ begin if not exists (
  select 1
  from pg_policies
  where policyname = 'Allow media output updates'
) then create policy "Allow media output updates" on storage.objects for
update to authenticated using (bucket_id = 'media-outputs') with check (bucket_id = 'media-outputs');
end if;
end $$;
do $$ begin if not exists (
  select 1
  from pg_policies
  where policyname = 'Allow media output reads'
) then create policy "Allow media output reads" on storage.objects for
select to authenticated using (bucket_id = 'media-outputs');
end if;
end $$;
do $$ begin if not exists (
  select 1
  from pg_policies
  where policyname = 'Allow media output deletes'
) then create policy "Allow media output deletes" on storage.objects for delete to authenticated using (bucket_id = 'media-outputs');
end if;
end $$;
-- 3) Add kind column to media_assets (input|output) default 'output'
alter table public.media_assets
add column if not exists kind text not null default 'output';
-- 4) Add constraint for allowed kinds (idempotent)
do $$ begin if not exists (
  select 1
  from pg_constraint
  where conname = 'media_assets_kind_chk'
) then
alter table public.media_assets
add constraint media_assets_kind_chk check (kind in ('input', 'output'));
end if;
end $$;
-- 5) (Optional) NOTE: We keep existing unique (job_id, asset_index). For input assets we will
--    use negative asset_index values to avoid collisions with output indices starting at 0.
