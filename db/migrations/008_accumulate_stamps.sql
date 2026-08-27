-- Um documento pode passar por varias maos (remetente, secretaria, quem despacha) e cada
-- uma aplica o seu proprio carimbo/assinatura. Antes, cada aplicacao SUBSTITUIA a anterior
-- (stamp_metadata/signature_metadata eram um unico objecto) -- agora acumulam-se num historico.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS stamps_metadata jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS signatures_metadata jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE documents SET stamps_metadata = jsonb_build_array(stamp_metadata)
  WHERE stamp_metadata IS NOT NULL AND stamps_metadata = '[]'::jsonb;
UPDATE documents SET signatures_metadata = jsonb_build_array(signature_metadata)
  WHERE signature_metadata IS NOT NULL AND signatures_metadata = '[]'::jsonb;
