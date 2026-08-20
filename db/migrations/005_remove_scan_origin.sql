BEGIN;

UPDATE documents
SET source = 'importado'
WHERE source = 'digitalizado';

UPDATE system_settings
SET setting_value = jsonb_set(
  setting_value,
  '{documentOrigins}',
  COALESCE(
    (
      SELECT jsonb_agg(origin)
      FROM jsonb_array_elements(setting_value->'documentOrigins') AS origin
      WHERE origin->>'code' <> 'digitalizado'
    ),
    '[]'::jsonb
  )
)
WHERE setting_key = 'catalogs'
  AND jsonb_typeof(setting_value->'documentOrigins') = 'array';

COMMIT;
