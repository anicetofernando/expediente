import { PageHeader } from "@/components/shared/page-header";
import { ExpedientTable } from "@/components/expedients/expedient-table";
import { Alert } from "@/components/ui/alert";
import { allExpedients } from "@/data/expedients";

export const metadata = { title: "Arquivo" };

export default function ArquivoPage() {
  const data = allExpedients.filter((e) => e.estado === "arquivado");
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Arquivo"
        description="Arquivo digital permanente dos processos concluídos"
        breadcrumb={[{ label: "Documentos", href: "/documentos" }, { label: "Arquivo" }]}
      />
      <div className="px-6 pt-4">
        <Alert variant="neutral" title="Arquivo digital permanente">
          Este espaço reúne todos os processos de expediente já concluídos e formalmente arquivados. Os registos são
          conservados de forma permanente para efeitos de consulta institucional e auditoria, não sendo permitida a
          sua edição.
        </Alert>
      </div>
      <ExpedientTable
        data={data}
        emptyTitle="Arquivo vazio"
        emptyDescription="Ainda não existem processos arquivados no sistema."
      />
    </div>
  );
}
