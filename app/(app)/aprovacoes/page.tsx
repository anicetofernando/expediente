import { PageHeader } from "@/components/shared/page-header";
import { ApprovalTable } from "@/components/approvals/approval-table";
import { allExpedients } from "@/data/expedients";

export const metadata = { title: "Minhas aprovações" };

const PENDING_STATES = ["em_analise", "aguardando_parecer", "aguardando_esclarecimento", "atrasado"];

export default function AprovacoesPage() {
  const pendentes = allExpedients
    .filter((expedient) => PENDING_STATES.includes(expedient.estado))
    .map((expedient) => ({
      id: expedient.id,
      protocolo: expedient.protocolo,
      assunto: expedient.assunto,
      estado: expedient.estado,
      prioridade: expedient.prioridade,
      remetente: expedient.remetente.nome,
      unidadeOrigem: expedient.unidadeOrigem,
      dataEntrada: expedient.dataEntrada,
      prazo: expedient.prazo,
      atrasado: expedient.atrasado,
    }));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Minhas aprovações" breadcrumb={[{ label: "Aprovações" }]} />
      <div className="flex min-h-0 flex-1 p-4">
        <ApprovalTable items={pendentes} />
      </div>
    </div>
  );
}
