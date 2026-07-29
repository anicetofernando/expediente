import { PageHeader } from "@/components/shared/page-header";
import { ExpedientTable } from "@/components/expedients/expedient-table";
import { allExpedients } from "@/data/expedients";

export const metadata = { title: "Aguardando parecer" };

export default function AguardandoParecerPage() {
  const data = allExpedients.filter((e) => e.estado === "aguardando_parecer");
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Aguardando parecer"
        breadcrumb={[{ label: "Aprovações", href: "/aprovacoes" }, { label: "Aguardando parecer" }]}
      />
      <ExpedientTable
        data={data}
        emptyTitle="Sem processos aguardando parecer"
        emptyDescription=""
      />
    </div>
  );
}
