import Link from "next/link";
import { ArrowRight, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireSession } from "@/lib/auth";
import { listExpedients } from "@/lib/expedients-db";
import { formatDate } from "@/lib/utils";
import type { Expedient } from "@/types";

export const metadata = { title: "Tarefas pendentes" };

function groupByUrgency(data: Expedient[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7 = new Date(today.getTime() + 7 * 86400000);
  const atrasadas: Expedient[] = [];
  const hoje: Expedient[] = [];
  const semana: Expedient[] = [];
  const outras: Expedient[] = [];

  data.forEach((e) => {
    const prazo = new Date(e.prazo);
    if (e.atrasado || prazo < today) atrasadas.push(e);
    else if (prazo.toDateString() === today.toDateString()) hoje.push(e);
    else if (prazo <= in7) semana.push(e);
    else outras.push(e);
  });

  return { atrasadas, hoje, semana, outras };
}

export default async function TarefasPage() {
  const data = await listExpedients(await requireSession(), "inbox");
  const { atrasadas, hoje, semana, outras } = groupByUrgency(data);

  return (
    <div>
      <PageHeader
        title="Tarefas pendentes"
        description="Todas as acções que aguardam a sua intervenção, organizadas por urgência"
        breadcrumb={[{ label: "Tarefas pendentes" }]}
      />
      <div className="space-y-6 p-6">
        {data.length === 0 ? (
          <EmptyState icon={ListChecks} title="Sem tarefas pendentes" description="Não existem processos à sua responsabilidade neste momento." />
        ) : (
          <>
            <TaskGroup title="Atrasadas" tone="crimson" items={atrasadas} />
            <TaskGroup title="Para hoje" tone="amber" items={hoje} />
            <TaskGroup title="Esta semana" tone="info" items={semana} />
            <TaskGroup title="Outras tarefas" tone="graphite" items={outras} />
          </>
        )}
      </div>
    </div>
  );
}

function TaskGroup({ title, tone, items }: { title: string; tone: "crimson" | "amber" | "info" | "graphite"; items: Expedient[] }) {
  if (items.length === 0) return null;
  const dotClass = { crimson: "bg-crimson-500", amber: "bg-amber-500", info: "bg-info-500", graphite: "bg-graphite-400" }[tone];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${dotClass}`} />
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{items.length} processo(s)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-graphite-150">
          {items.map((e) => (
            <li key={e.id}>
              <Link href={`/expedientes/${e.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-graphite-50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-graphite-900">{e.protocolo}</span>
                    <PriorityBadge priority={e.prioridade} />
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-graphite-500">{e.assunto}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-medium tabular-nums text-graphite-700">{formatDate(e.prazo)}</p>
                  <StatusBadge status={e.estado} className="mt-1" />
                </div>
                <ArrowRight className="size-4 shrink-0 text-graphite-300" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
