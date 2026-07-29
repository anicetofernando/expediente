import { PageHeader } from "@/components/shared/page-header";
import { ExpedientTable } from "@/components/expedients/expedient-table";
import { caixaEntrada } from "@/lib/expedient-filters";

export const metadata = { title: "Caixa de entrada" };

export default function CaixaEntradaPage() {
  const data = caixaEntrada();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Caixa de entrada"
        description="Expedientes actualmente à sua responsabilidade, aguardando acção"
        breadcrumb={[{ label: "Expediente" }, { label: "Caixa de entrada" }]}
      />
      <ExpedientTable data={data} emptyTitle="Caixa de entrada vazia" emptyDescription="Não existem expedientes atribuídos a si neste momento." />
    </div>
  );
}
