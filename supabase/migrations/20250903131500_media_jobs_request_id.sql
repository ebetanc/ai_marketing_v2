-- Add request_id to media_jobs for precise client correlation
-- Date: 2025-09-03
ALTER TABLE public.media_jobs
ADD COLUMN IF NOT EXISTS request_id text;
CREATE INDEX IF NOT EXISTS media_jobs_request_id_idx ON public.media_jobs(request_id);
-- (Optional) Future: consider UNIQUE(request_id) if generation insert is guaranteed 1:1.
