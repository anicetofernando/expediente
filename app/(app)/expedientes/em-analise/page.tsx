import { PageHeader } from "@/components/shared/page-header";
import { ExpedientTable } from "@/components/expedients/expedient-table";
import { emAnalise } from "@/lib/expedient-filters";

export const metadata = { title: "Em análise" };

export default function EmAnalisePage() {
  const data = emAnalise();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Em análise"
        description="Processos actualmente em avaliação técnica pela unidade responsável"
        breadcrumb={[{ label: "Expediente" }, { label: "Em análise" }]}
      />
      <ExpedientTable data={data} emptyTitle="Nenhum processo em análise" emptyDescription="Não existem processos em avaliação técnica neste momento." />
    </div>
  );
}
