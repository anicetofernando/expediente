import { ExpedientTable } from "@/components/expedients/expedient-table";
import { PageHeader } from "@/components/shared/page-header";
import { requireSession } from "@/lib/auth";
import { listExpedients, type ExpedientView } from "@/lib/expedients-db";
import { remetenteDisplayStatus } from "@/lib/status";

export async function PersistentExpedientList({ view, title, description, emptyTitle, emptyDescription, initialSearch = "", breadcrumb = true }: {
  view: ExpedientView; title: string; description: string; emptyTitle?: string; emptyDescription?: string; initialSearch?: string; breadcrumb?: boolean;
}) {
  const session = await requireSession();
  const rawData = await listExpedients(session, view);
  // O remetente nao ve o detalhe interno da tramitacao do lado do superior --
  // ver lib/status.ts#remetenteDisplayStatus.
  const data = session.perfilNavegacao === "remetente"
    ? rawData.map((expedient) => ({ ...expedient, estado: remetenteDisplayStatus(expedient.estado) }))
    : rawData;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title={title} description={description.replace("{count}", String(data.length))} breadcrumb={breadcrumb ? [{ label: "Expediente" }, { label: title }] : undefined} />
      <ExpedientTable data={data} initialSearch={initialSearch} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
    </div>
  );
}
