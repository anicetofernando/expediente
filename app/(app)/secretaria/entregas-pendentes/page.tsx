import { PageHeader } from "@/components/shared/page-header";
import { ExpedientTable } from "@/components/expedients/expedient-table";
import { allExpedients } from "@/data/expedients";

export const metadata = { title: "Entregas pendentes — Secretaria" };

export default function EntregasPendentesPage() {
  const data = allExpedients.filter((e) => e.estado === "disponivel_remetente");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Entregas pendentes"
        breadcrumb={[{ label: "Secretaria" }, { label: "Entregas pendentes" }]}
      />
      <ExpedientTable
        data={data}
        dense
        emptyTitle="Sem entregas pendentes"
        emptyDescription="Não existem respostas disponíveis aguardando levantamento."
      />
    </div>
  );
}
