import { PageHeader } from "@/components/shared/page-header";
import { ExpedientTable } from "@/components/expedients/expedient-table";
import { allExpedients } from "@/data/expedients";

export const metadata = { title: "Todos os expedientes" };

export default function ExpedientesPage({
  searchParams,
}: {
  searchParams?: { q?: string | string[] };
}) {
  const initialSearch = Array.isArray(searchParams?.q) ? searchParams?.q[0] ?? "" : searchParams?.q ?? "";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Todos os expedientes"
        description={`${allExpedients.length} processos registados no sistema`}
      />
      <ExpedientTable data={allExpedients} initialSearch={initialSearch} />
    </div>
  );
}
