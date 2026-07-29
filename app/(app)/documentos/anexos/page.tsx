import { PageHeader } from "@/components/shared/page-header";
import { AttachmentsTable } from "@/components/documents/attachments-table";
import type { FlatDocument } from "@/components/documents/document-library";
import { allExpedients } from "@/data/expedients";

export const metadata = { title: "Anexos" };

export default function AnexosPage() {
  const anexos: FlatDocument[] = allExpedients.flatMap((e) =>
    e.documentos
      .filter((d) => d.tipo === "anexo")
      .map((d) => ({ ...d, protocolo: e.protocolo, expedienteId: e.id, assunto: e.assunto }))
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Anexos"
        description="Documentos anexados aos processos de expediente, independentemente do seu estado"
        breadcrumb={[{ label: "Documentos", href: "/documentos" }, { label: "Anexos" }]}
      />
      <AttachmentsTable documents={anexos} />
    </div>
  );
}
