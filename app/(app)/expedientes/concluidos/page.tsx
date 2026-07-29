import { PageHeader } from "@/components/shared/page-header";
import { ExpedientTable } from "@/components/expedients/expedient-table";
import { concluidos } from "@/lib/expedient-filters";

export const metadata = { title: "Concluídos" };

export default function ConcluidosPage() {
  const data = concluidos();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Concluídos"
        description="Processos aprovados, entregues ou arquivados"
        breadcrumb={[{ label: "Expediente" }, { label: "Concluídos" }]}
      />
      <ExpedientTable data={data} emptyTitle="Nenhum processo concluído" emptyDescription="Os processos concluídos aparecerão aqui." />
    </div>
  );
}
