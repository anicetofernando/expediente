import { PageHeader } from "@/components/shared/page-header";
import { ExpedientTable } from "@/components/expedients/expedient-table";
import { meusExpedientes } from "@/lib/expedient-filters";

export const metadata = { title: "Meus expedientes" };

export default function MeusExpedientesPage() {
  const data = meusExpedientes();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Meus expedientes"
        description="Processos que criou ou dos quais é actualmente responsável"
        breadcrumb={[{ label: "Expediente" }, { label: "Meus expedientes" }]}
      />
      <ExpedientTable data={data} emptyTitle="Ainda não tem expedientes" emptyDescription="Os processos que criar ou pelos quais for responsável aparecerão aqui." />
    </div>
  );
}
