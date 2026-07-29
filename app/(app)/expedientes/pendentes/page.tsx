import { PageHeader } from "@/components/shared/page-header";
import { ExpedientTable } from "@/components/expedients/expedient-table";
import { pendentes } from "@/lib/expedient-filters";

export const metadata = { title: "Pendentes" };

export default function PendentesPage() {
  const data = pendentes();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Pendentes"
        description="Processos em tramitação que ainda aguardam conclusão de uma etapa"
        breadcrumb={[{ label: "Expediente" }, { label: "Pendentes" }]}
      />
      <ExpedientTable data={data} emptyTitle="Sem processos pendentes" emptyDescription="Todos os processos foram concluídos ou arquivados." />
    </div>
  );
}
