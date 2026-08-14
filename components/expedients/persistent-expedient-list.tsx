import { ExpedientTable } from "@/components/expedients/expedient-table";
import { PageHeader } from "@/components/shared/page-header";
import { requireSession } from "@/lib/auth";
import { listExpedients, type ExpedientView } from "@/lib/expedients-db";

export async function PersistentExpedientList({ view, title, description, emptyTitle, emptyDescription, initialSearch = "", breadcrumb = true }: {
  view: ExpedientView; title: string; description: string; emptyTitle?: string; emptyDescription?: string; initialSearch?: string; breadcrumb?: boolean;
}) {
  const session = await requireSession();
  const data = await listExpedients(session, view);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title={title} description={description.replace("{count}", String(data.length))} breadcrumb={breadcrumb ? [{ label: "Expediente" }, { label: title }] : undefined} />
      <ExpedientTable data={data} initialSearch={initialSearch} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
    </div>
  );
}
