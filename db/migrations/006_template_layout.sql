BEGIN;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS template_metadata jsonb;

COMMIT;
