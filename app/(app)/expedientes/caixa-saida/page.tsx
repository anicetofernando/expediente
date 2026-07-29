import { PageHeader } from "@/components/shared/page-header";
import { ExpedientTable } from "@/components/expedients/expedient-table";
import { caixaSaida } from "@/lib/expedient-filters";

export const metadata = { title: "Caixa de saída" };

export default function CaixaSaidaPage() {
  const data = caixaSaida();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Caixa de saída"
        description="Correspondência e processos originados pela sua unidade orgânica"
        breadcrumb={[{ label: "Expediente" }, { label: "Caixa de saída" }]}
      />
      <ExpedientTable data={data} emptyTitle="Nenhum expediente enviado" emptyDescription="Os processos originados pela sua unidade aparecerão aqui." />
    </div>
  );
}
