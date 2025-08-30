-- Create storage bucket for media input sources (raw user uploaded reference images)
-- Date: 2025-08-30
-- Idempotent bucket creation & basic RLS-like policies (storage uses its own policy system)
insert into storage.buckets (id, name, public)
values ('media-inputs', 'media-inputs', false) on conflict (id) do nothing;
-- Basic policies: allow authenticated users to read & write objects in this bucket.
-- You may later tighten this to restrict access based on job/company ownership by
-- encoding the job id in the object path and performing a join in USING/ WITH CHECK.
-- For now this keeps implementation simple while still requiring auth.
do $$ begin if not exists (
  select 1
  from pg_policies
  where policyname = 'Allow media input uploads'
) then create policy "Allow media input uploads" on storage.objects for
insert to authenticated with check (bucket_id = 'media-inputs');
end if;
end $$;
do $$ begin if not exists (
  select 1
  from pg_policies
  where policyname = 'Allow media input updates'
) then create policy "Allow media input updates" on storage.objects for
update to authenticated using (bucket_id = 'media-inputs') with check (bucket_id = 'media-inputs');
end if;
end $$;
do $$ begin if not exists (
  select 1
  from pg_policies
  where policyname = 'Allow media input reads'
) then create policy "Allow media input reads" on storage.objects for
select to authenticated using (bucket_id = 'media-inputs');
end if;
end $$;
do $$ begin if not exists (
  select 1
  from pg_policies
  where policyname = 'Allow media input deletes'
) then create policy "Allow media input deletes" on storage.objects for delete to authenticated using (bucket_id = 'media-inputs');
end if;
end $$;
-- NOTE: Consider tightening policies later to ensure users can only access paths for jobs they own.
-- A future enhancement: enforce path format '<jobId>/filename' and join to media_jobs/company ownership.
