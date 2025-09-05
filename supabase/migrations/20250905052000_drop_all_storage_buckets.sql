-- Drop all storage buckets and their objects
-- Date: 2025-09-04
-- WARNING: This permanently deletes all files & metadata in storage.buckets and storage.objects.
-- Current buckets intended for removal: media
-- If buckets are recreated later, ensure policies are re-applied as needed.
BEGIN;
-- Remove all objects (will cascade via FK on bucket_id but we delete explicitly for clarity)
DELETE FROM storage.objects;
-- Drop specific bucket(s)
DELETE FROM storage.buckets;
COMMIT;
