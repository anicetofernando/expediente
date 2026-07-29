import type { Expedient } from "@/types";
import {
  ExpedientTableClient,
  type ExpedientTableRow,
} from "@/components/expedients/expedient-table-client";

export function ExpedientTable({
  data,
  emptyTitle = "Nenhum expediente encontrado",
  emptyDescription = "Ajuste os filtros ou crie um novo expediente para começar.",
  dense = false,
  initialSearch = "",
}: {
  data: Expedient[];
  emptyTitle?: string;
  emptyDescription?: string;
  dense?: boolean;
  initialSearch?: string;
}) {
  const rows: ExpedientTableRow[] = data.map((expedient) => ({
    id: expedient.id,
    protocolo: expedient.protocolo,
    assunto: expedient.assunto,
    estado: expedient.estado,
    remetente: expedient.remetente.nome,
    responsavelActual: expedient.responsavelActual,
    dataEntrada: expedient.dataEntrada,
    prazo: expedient.prazo,
    atrasado: expedient.atrasado,
  }));

  return (
    <div className="min-h-0 flex-1 bg-graphite-50 p-3 lg:p-4">
      <ExpedientTableClient
        data={rows}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        dense={dense}
        initialSearch={initialSearch}
      />
    </div>
  );
}
