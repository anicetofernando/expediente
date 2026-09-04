-- Fluxo operacional unificado da Secretaria.
-- Mantem os estados antigos para leitura de processos historicos, mas optimiza
-- as duas filas que continuam activas: recepcao e entrega.

CREATE INDEX IF NOT EXISTS expedients_secretary_intake_idx
  ON expedients (created_at DESC)
  WHERE status IN ('submetido', 'recebido', 'protocolado');

CREATE INDEX IF NOT EXISTS expedients_secretary_delivery_idx
  ON expedients (updated_at DESC)
  WHERE status IN ('aprovado', 'rejeitado', 'disponivel_remetente');

CREATE INDEX IF NOT EXISTS expedients_origin_secretary_idx
  ON expedients (origin_secretary_id)
  WHERE origin_secretary_id IS NOT NULL;

-- A confirmacao do remetente passa a concluir o expediente imediatamente.
UPDATE expedients
   SET status = 'arquivado',
       next_step = 'Concluido',
       completed_at = COALESCE(completed_at, updated_at, now())
 WHERE status = 'recebimento_confirmado';
