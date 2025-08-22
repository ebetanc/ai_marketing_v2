-- Placeholder migration to reconcile remote-applied version 20250822120100
-- This version exists remotely but was absent locally, causing 'Remote migration versions not found' errors.
-- No schema changes are applied here; it documents that the remote already ran whatever statements corresponded to this version.
-- If the original migration contents are recovered later, replace this file's body accordingly (keeping the same filename).
begin;
-- (intentionally empty)
commit;
