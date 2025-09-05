-- Drop unused storage object policies that were present remotely but not needed
-- Date: 2025-09-04
-- Purpose: Remove legacy anon JPG folder policies
BEGIN;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1ffg0oo_0" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1ffg0oo_1" ON storage.objects;
COMMIT;
