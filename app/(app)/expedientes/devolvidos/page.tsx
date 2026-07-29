import { PageHeader } from "@/components/shared/page-header";
import { ExpedientTable } from "@/components/expedients/expedient-table";
import { devolvidos } from "@/lib/expedient-filters";

export const metadata = { title: "Devolvidos" };

export default function DevolvidosPage() {
  const data = devolvidos();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Devolvidos"
        description="Processos devolvidos para correcção ou rejeitados, aguardando nova acção"
        breadcrumb={[{ label: "Expediente" }, { label: "Devolvidos" }]}
      />
      <ExpedientTable data={data} emptyTitle="Nenhum processo devolvido" emptyDescription="Não existem processos devolvidos ou rejeitados de momento." />
    </div>
  );
}
