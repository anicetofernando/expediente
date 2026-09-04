-- Uma resposta/despacho escrita por outro departamento e uma carta propria, com o
-- seu proprio numero de protocolo (gerado pela unidade de quem a escreve), mesmo
-- ficando associada ao mesmo expediente no sistema.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_number text;
