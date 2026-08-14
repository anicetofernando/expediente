import { PageHeader } from "@/components/shared/page-header";
import { DelegationsPanel } from "@/components/approvals/delegations-panel";
import { listDelegations, listUsers } from "@/lib/admin-db";

export const metadata = { title: "Delegados" };

export default async function DelegadosPage() {
  const [delegations, users] = await Promise.all([listDelegations(), listUsers()]);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Delegados"
        breadcrumb={[{ label: "Aprovações", href: "/aprovacoes" }, { label: "Delegados" }]}
      />
      <DelegationsPanel initialDelegations={delegations} users={users} />
    </div>
  );
}
