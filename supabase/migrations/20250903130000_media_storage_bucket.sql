-- Ensure 'media' storage bucket exists and is publicly readable
-- Date: 2025-09-03
-- 1) Create or update bucket
insert into storage.buckets (id, name, public)
values ('media', 'media', true) on conflict (id) do
update
set public = true;
-- 2) Policies (idempotent: drop if exists then recreate)
-- Public read access for media bucket
drop policy if exists "Public read media" on storage.objects;
create policy "Public read media" on storage.objects for
select using (bucket_id = 'media');
-- Allow authenticated users to upload into media bucket
drop policy if exists "Authenticated upload media" on storage.objects;
create policy "Authenticated upload media" on storage.objects for
insert to authenticated with check (bucket_id = 'media');
-- Allow authenticated users to update their own objects (owner column managed by Supabase)
drop policy if exists "Authenticated update own media" on storage.objects;
create policy "Authenticated update own media" on storage.objects for
update to authenticated using (
    bucket_id = 'media'
    and owner = auth.uid()
  ) with check (
    bucket_id = 'media'
    and owner = auth.uid()
  );
-- Allow authenticated users to delete their own objects
drop policy if exists "Authenticated delete own media" on storage.objects;
create policy "Authenticated delete own media" on storage.objects for delete to authenticated using (
  bucket_id = 'media'
  and owner = auth.uid()
);
-- NOTE: If you later need private assets, create a separate bucket instead of changing this one.
