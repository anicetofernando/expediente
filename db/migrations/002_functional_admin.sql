BEGIN;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_slug_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_slug_format_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_slug_format_check CHECK (slug ~ '^[a-z0-9-]+$');

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_user_idx ON password_reset_requests(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS book_closures (
  period varchar(7) PRIMARY KEY CHECK (period ~ '^[0-9]{4}-[0-9]{2}$'),
  closed_by uuid NOT NULL REFERENCES users(id),
  closed_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
