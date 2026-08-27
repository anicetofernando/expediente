import { PageHeader } from "@/components/shared/page-header";
import { requirePermission } from "@/lib/auth";
import { listExpedients } from "@/lib/expedients-db";
import type { ExpedientStatus } from "@/types";
import { LivroBoard, type LivroRow } from "@/components/secretariat/livro-board";
import { LivroHeaderActions } from "@/components/secretariat/livro-header-actions";

export const metadata = { title: "Livro digital de expediente" };

// Estados que representam a saída do processo da fase inicial de recepção/protocolo —
// usados para preencher a coluna "Data de saída" do livro.
const ESTADOS_COM_SAIDA: ExpedientStatus[] = [
  "encaminhado",
  "em_analise",
  "aguardando_parecer",
  "aguardando_esclarecimento",
  "devolvido",
  "aprovado",
  "rejeitado",
  "disponivel_remetente",
  "recebimento_confirmado",
  "arquivado",
  "cancelado",
  "expirado",
];

// Estados em que já existe entrega/confirmação registada junto ao remetente,
// pelo que se preenche a coluna "Recebido por" com o responsável actual.
const ESTADOS_COM_RECEBIMENTO: ExpedientStatus[] = ["disponivel_remetente", "recebimento_confirmado"];

function buildLivroRows(allExpedients: Awaited<ReturnType<typeof listExpedients>>): LivroRow[] {
  const ordenados = [...allExpedients].sort((a, b) => new Date(a.dataEntrada).getTime() - new Date(b.dataEntrada).getTime());

  return ordenados.map((exp, index) => ({
    numeroSequencial: index + 1,
    protocolo: exp.protocolo,
    data: exp.dataEntrada,
    origem: exp.unidadeOrigem,
    remetente: exp.remetente.nome,
    assunto: exp.assunto,
    destinatario: exp.destinatario,
    estado: exp.estado,
    dataSaida: ESTADOS_COM_SAIDA.includes(exp.estado) ? exp.ultimaActualizacao : undefined,
    recebidoPor: ESTADOS_COM_RECEBIMENTO.includes(exp.estado) ? exp.responsavelActual : undefined,
    observacoes: exp.proximaEtapa,
    expedientId: exp.id,
  }));
}

export default async function LivroPage() {
  const session = await requirePermission(["secretaria", "administracao"], ["livro.gerir"]);
  const rows = buildLivroRows(await listExpedients(session, "all"));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Livro digital de expediente"
        description="Registo sequencial e cronológico de toda a correspondência recebida e expedida pela instituição, nos termos do regulamento interno de expediente."
        breadcrumb={[{ label: "Livro de expediente" }]}
        actions={<LivroHeaderActions rows={rows} />}
      />
      <LivroBoard rows={rows} />
    </div>
  );
}
