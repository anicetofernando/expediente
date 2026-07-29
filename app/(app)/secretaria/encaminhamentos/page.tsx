import { PageHeader } from "@/components/shared/page-header";
import { ExpedientTable } from "@/components/expedients/expedient-table";
import { allExpedients } from "@/data/expedients";

export const metadata = { title: "Encaminhamentos — Secretaria" };

export default function EncaminhamentosPage() {
  const data = allExpedients.filter((e) => e.estado === "protocolado" || e.estado === "encaminhado");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Encaminhamentos"
        breadcrumb={[{ label: "Secretaria" }, { label: "Encaminhamentos" }]}
      />
      <ExpedientTable
        data={data}
        dense
        emptyTitle="Sem encaminhamentos"
        emptyDescription="Não existem expedientes para encaminhar ou já encaminhados."
      />
    </div>
  );
}
