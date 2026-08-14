import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DocumentLibrary, type FlatDocument } from "@/components/documents/document-library";
import { requireSession } from "@/lib/auth";
import { listDocuments } from "@/lib/expedients-db";

export const metadata = { title: "Documentos" };

export default async function DocumentosPage() {
  const documents: FlatDocument[] = await listDocuments(await requireSession());

  const total = documents.length;
  const carimbados = documents.filter((d) => d.carimbado).length;
  const assinados = documents.filter((d) => d.assinado).length;
  const confidenciais = documents.filter((d) => d.confidencialidade === "confidencial").length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Documentos"
        description="Biblioteca central de todos os documentos associados aos processos de expediente"
        breadcrumb={[{ label: "Documentos" }]}
      />

      <div className="grid grid-cols-2 gap-3 px-6 pt-4 sm:grid-cols-4">
        <StatCard label="Total de documentos" value={total} icon="FileText" tone="navy" />
        <StatCard label="Carimbados" value={carimbados} icon="Stamp" tone="info" />
        <StatCard label="Assinados" value={assinados} icon="PenTool" tone="success" />
        <StatCard label="Confidenciais" value={confidenciais} icon="ShieldAlert" tone="crimson" />
      </div>

      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        <DocumentLibrary documents={documents} />
      </div>
    </div>
  );
}
