import { PageHeader } from "@/components/shared/page-header";
import { ExpedientTable } from "@/components/expedients/expedient-table";
import { allExpedients } from "@/data/expedients";

export const metadata = { title: "Histórico de decisões" };

const DECIDED_STATES = ["aprovado", "rejeitado", "devolvido", "recebimento_confirmado", "arquivado"];

export default function HistoricoDecisoesPage() {
  const data = allExpedients.filter((e) => DECIDED_STATES.includes(e.estado));
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Histórico de decisões"
        breadcrumb={[{ label: "Aprovações", href: "/aprovacoes" }, { label: "Histórico de decisões" }]}
      />
      <ExpedientTable
        data={data}
        emptyTitle="Sem decisões registadas"
        emptyDescription=""
      />
    </div>
  );
}
