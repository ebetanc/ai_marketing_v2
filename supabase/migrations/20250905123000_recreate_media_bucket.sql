-- Recreate 'media' storage bucket (idempotent) after 20250905052000_drop_all_storage_buckets.sql
-- Date: 2025-09-05
-- Purpose: Ensure required public bucket 'media' exists for asset uploads used by UI pages
-- Safe to re-run: uses upsert-like pattern and (re)creates policies.
insert into storage.buckets (id, name, public)
values ('media', 'media', true) on conflict (id) do
update
set public = true;
-- Policies
drop policy if exists "Public read media" on storage.objects;
create policy "Public read media" on storage.objects for
select using (bucket_id = 'media');
drop policy if exists "Authenticated upload media" on storage.objects;
create policy "Authenticated upload media" on storage.objects for
insert to authenticated with check (bucket_id = 'media');
drop policy if exists "Authenticated update own media" on storage.objects;
create policy "Authenticated update own media" on storage.objects for
update to authenticated using (
    bucket_id = 'media'
    and owner = auth.uid()
  ) with check (
    bucket_id = 'media'
    and owner = auth.uid()
  );
drop policy if exists "Authenticated delete own media" on storage.objects;
create policy "Authenticated delete own media" on storage.objects for delete to authenticated using (
  bucket_id = 'media'
  and owner = auth.uid()
);
-- NOTE: Keep this bucket public for CDN-style delivery of generated/uploaded assets.
