"use client";

import * as React from "react";
import Link from "next/link";
import {
  AtSign,
  Bell,
  CheckCheck,
  ClipboardCheck,
  Clock3,
  ListChecks,
  Settings2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { notifications as initialNotifications } from "@/data/notifications";
import { cn, formatRelativeTime } from "@/lib/utils";

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  tarefa: ListChecks,
  aprovacao: ClipboardCheck,
  prazo: Clock3,
  sistema: Settings2,
  mencao: AtSign,
};

const TYPE_LABEL: Record<string, string> = {
  tarefa: "Tarefa",
  aprovacao: "Aprovação",
  prazo: "Prazo",
  sistema: "Sistema",
  mencao: "Menção",
};

export default function NotificacoesPage() {
  const [items, setItems] = React.useState(initialNotifications);
  const [filter, setFilter] = React.useState<"todas" | "nao-lidas" | "urgentes">("todas");

  const filtered = items.filter((n) => (filter === "nao-lidas" ? !n.lida : filter === "urgentes" ? n.urgente : true));

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
  }

  return (
    <div>
      <PageHeader
        title="Notificações"
        description="Alertas de tarefas, aprovações, prazos e actividade do sistema"
        breadcrumb={[{ label: "Notificações" }]}
        actions={
          <Button variant="secondary" size="sm" onClick={() => setItems((prev) => prev.map((n) => ({ ...n, lida: true })))}>
            <CheckCheck className="size-3.5" /> Marcar todas como lidas
          </Button>
        }
      />

      <div className="p-6">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="todas">Todas ({items.length})</TabsTrigger>
            <TabsTrigger value="nao-lidas">Não lidas ({items.filter((n) => !n.lida).length})</TabsTrigger>
            <TabsTrigger value="urgentes">Urgentes ({items.filter((n) => n.urgente).length})</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="pt-4">
            {filtered.length === 0 ? (
              <EmptyState icon={Bell} title="Sem notificações" description="Não existem notificações para este filtro." />
            ) : (
              <Card className="divide-y divide-graphite-150 overflow-hidden">
                {filtered.map((n) => {
                  const Icon = TYPE_ICON[n.tipo] ?? Bell;
                  const content = (
                    <>
                      <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full", n.urgente ? "bg-crimson-50 text-crimson-600" : "bg-graphite-100 text-graphite-500")}>
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("text-[13px]", !n.lida ? "font-semibold text-graphite-900" : "font-medium text-graphite-700")}>{n.titulo}</span>
                          <span className="rounded bg-graphite-100 px-1.5 py-0.5 text-2xs text-graphite-500">{TYPE_LABEL[n.tipo]}</span>
                          {!n.lida && <span className="size-1.5 rounded-full bg-navy-600" />}
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-graphite-500">{n.descricao}</p>
                        <p className="mt-1.5 text-2xs text-graphite-400">{formatRelativeTime(n.data)}{n.protocolo ? ` · ${n.protocolo}` : ""}</p>
                      </div>
                    </>
                  );
                  const rowClass = cn("flex gap-3.5 px-5 py-4 transition-colors hover:bg-graphite-50 w-full text-left", !n.lida && "bg-navy-50/40");
                  const expedienteId = n.protocolo ? protocoloToId(n.protocolo) : "";
                  if (expedienteId) {
                    return (
                      <Link key={n.id} href={`/expedientes/${expedienteId}`} onClick={() => markRead(n.id)} className={rowClass}>
                        {content}
                      </Link>
                    );
                  }
                  return (
                    <button key={n.id} onClick={() => markRead(n.id)} className={rowClass}>
                      {content}
                    </button>
                  );
                })}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function protocoloToId(protocolo: string) {
  // As notificações de demonstração referem-se a processos já existentes nos dados simulados.
  const map: Record<string, string> = {
    "CFM/DOC/2026/0412": "exp-2026-0412",
    "CFM/DAP/2026/0455": "exp-2026-0455",
    "CFM/DOF/2026/0522": "exp-2026-0522",
    "CFM/DMC/2026/0398": "exp-2026-0398",
    "CFM/DJU/2026/0387": "exp-2026-0387",
  };
  return map[protocolo] ?? "";
}
