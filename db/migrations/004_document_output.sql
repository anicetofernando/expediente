BEGIN;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS stamp_id text,
  ADD COLUMN IF NOT EXISTS signature_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stamp_metadata jsonb,
  ADD COLUMN IF NOT EXISTS signature_metadata jsonb;

COMMIT;
