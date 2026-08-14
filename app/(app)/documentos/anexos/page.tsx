import { PageHeader } from "@/components/shared/page-header";
import { AttachmentsTable } from "@/components/documents/attachments-table";
import type { FlatDocument } from "@/components/documents/document-library";
import { requireSession } from "@/lib/auth";
import { listDocuments } from "@/lib/expedients-db";

export const metadata = { title: "Anexos" };

export default async function AnexosPage() {
  const anexos: FlatDocument[] = (await listDocuments(await requireSession())).filter((document) => document.tipo === "anexo");

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
