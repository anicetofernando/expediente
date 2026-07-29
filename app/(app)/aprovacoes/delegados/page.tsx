import { PageHeader } from "@/components/shared/page-header";
import { DelegationsPanel } from "@/components/approvals/delegations-panel";

export const metadata = { title: "Delegados" };

export default function DelegadosPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Delegados"
        breadcrumb={[{ label: "Aprovações", href: "/aprovacoes" }, { label: "Delegados" }]}
      />
      <DelegationsPanel />
    </div>
  );
}
