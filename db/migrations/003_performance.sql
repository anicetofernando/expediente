BEGIN;

-- Indices alinhados com as caixas, paineis e detalhes mais consultados.
CREATE INDEX IF NOT EXISTS expedients_created_at_idx
  ON expedients(created_at DESC);
CREATE INDEX IF NOT EXISTS expedients_origin_created_idx
  ON expedients(origin_unit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS expedients_recipient_created_idx
  ON expedients(recipient_unit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS expedients_creator_created_idx
  ON expedients(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS expedients_responsible_created_idx
  ON expedients(responsible_user_id, created_at DESC)
  WHERE responsible_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS expedients_status_created_idx
  ON expedients(status, created_at DESC);

CREATE INDEX IF NOT EXISTS documents_expedient_created_idx
  ON documents(expedient_id, created_at);
CREATE INDEX IF NOT EXISTS comments_expedient_created_idx
  ON comments(expedient_id, created_at);
CREATE INDEX IF NOT EXISTS audit_entity_created_idx
  ON audit_logs(entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS delegations_delegator_dates_idx
  ON delegations(delegator_id, active, starts_on, ends_on);

ANALYZE users;
ANALYZE user_profiles;
ANALYZE expedients;
ANALYZE documents;
ANALYZE timeline_events;
ANALYZE comments;
ANALYZE notifications;

COMMIT;
