-- Drop media generation related tables
-- Date: 2025-09-04
-- Purpose: Remove media_jobs and media_assets (and dependent objects) from the schema.
-- NOTE: This is destructive and irreversible without a backup. All associated data will be lost.
-- If you need to restore later, re-run the original media_generation migration.
BEGIN;
-- Drop child table first due to FK dependency on media_jobs
DROP TABLE IF EXISTS public.media_assets CASCADE;
DROP TABLE IF EXISTS public.media_jobs CASCADE;
COMMIT;
