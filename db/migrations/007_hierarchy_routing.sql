BEGIN;

ALTER TABLE expedients
  ADD COLUMN IF NOT EXISTS origin_secretary_id uuid REFERENCES users(id);

COMMIT;
