import { PageHeader } from "@/components/shared/page-header";
import { ExpedientTable } from "@/components/expedients/expedient-table";
import { allExpedients } from "@/data/expedients";
import type { ExpedientStatus } from "@/types";

export const metadata = { title: "Protocolos — Secretaria" };

const NAO_PROTOCOLADOS: ExpedientStatus[] = ["rascunho", "submetido", "recebido"];

export default function ProtocolosPage() {
  const data = allExpedients.filter((e) => !NAO_PROTOCOLADOS.includes(e.estado));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Protocolos"
        breadcrumb={[{ label: "Secretaria" }, { label: "Protocolos" }]}
      />
      <ExpedientTable
        data={data}
        dense
        emptyTitle="Sem expedientes protocolados"
        emptyDescription="Não existem expedientes protocolados para os filtros seleccionados."
      />
    </div>
  );
}
