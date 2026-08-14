import { PersistentExpedientList } from "@/components/expedients/persistent-expedient-list";

export const metadata = { title: "Todos os expedientes" };

export default function ExpedientesPage({
  searchParams,
}: {
  searchParams?: { q?: string | string[] };
}) {
  const initialSearch = Array.isArray(searchParams?.q) ? searchParams?.q[0] ?? "" : searchParams?.q ?? "";

  return <PersistentExpedientList view="all" title="Todos os expedientes" description="{count} processos registados no sistema" initialSearch={initialSearch} breadcrumb={false} />;
}
