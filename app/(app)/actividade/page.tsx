"use client";

import * as React from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { CatalogsProvider, useCatalogs } from "@/lib/catalogs";
import type { TimelineEvent } from "@/types";

const EVENT_TYPE_LABEL: Record<string, string> = {
  criacao: "Criação", submissao: "Submissão", recepcao: "Recepção", protocolo: "Protocolo",
  encaminhamento: "Encaminhamento", parecer: "Parecer", aprovacao: "Aprovação", rejeicao: "Rejeição",
  devolucao: "Devolução", carimbo: "Carimbo", assinatura: "Assinatura", entrega: "Entrega",
  confirmacao: "Confirmação", arquivo: "Arquivo", comentario: "Comentário",
};

function ActividadeContent() {
  const { organizationalUnits } = useCatalogs();
  const [search, setSearch] = React.useState("");
  const [unit, setUnit] = React.useState("todas");
  const [tipo, setTipo] = React.useState("todos");
  const [page, setPage] = React.useState(1);
  const pageSize = 15;

  const [allEvents, setAllEvents] = React.useState<(TimelineEvent & { protocolo: string; expedienteId: string })[]>([]);
  React.useEffect(() => {
    void fetch("/api/activity", { cache: "no-store" }).then(async (response) => {
      if (response.ok) setAllEvents((await response.json()).items ?? []);
    });
  }, []);

  const filtered = allEvents.filter((e) => {
    if (unit !== "todas" && e.unidade !== unit) return false;
    if (tipo !== "todos" && e.tipo !== tipo) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!e.titulo.toLowerCase().includes(q) && !e.utilizador.toLowerCase().includes(q) && !e.protocolo.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Envolve cada evento paginado num link para o respectivo processo, mantendo o componente Timeline genérico.
  const eventsWithLinks: TimelineEvent[] = paged;

  return (
    <div>
      <PageHeader title="Actividade recente" description="Registo cronológico de eventos em todos os processos de expediente" breadcrumb={[{ label: "Actividade recente" }]} />

      <div className="p-6">
        <div className="mb-4 flex flex-col gap-2.5 sm:flex-row">
          <div className="w-full sm:w-72">
            <SearchInput placeholder="Pesquisar por evento, utilizador ou protocolo…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} onClear={() => setSearch("")} />
          </div>
          <Select value={unit} onValueChange={(v) => { setUnit(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Unidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as unidades</SelectItem>
              {organizationalUnits.map((u) => (
                <SelectItem key={u.id} value={u.nome}>{u.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tipo} onValueChange={(v) => { setTipo(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Tipo de evento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {Object.entries(EVENT_TYPE_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="pt-5">
            {paged.length === 0 ? (
              <EmptyState icon={Activity} title="Sem eventos" description="Não existem eventos que correspondam aos filtros seleccionados." />
            ) : (
              <div className="space-y-1">
                {paged.map((event) => (
                  <Link key={event.id + event.expedienteId} href={`/expedientes/${event.expedienteId}`} className="-mx-2 block rounded-md px-2 py-1 hover:bg-graphite-50">
                    <TimelineRow event={event} protocolo={event.protocolo} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
          {filtered.length > 0 && (
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ActividadePage() {
  return <CatalogsProvider><ActividadeContent /></CatalogsProvider>;
}

function TimelineRow({ event, protocolo }: { event: TimelineEvent; protocolo: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-navy-500" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-graphite-700">
          <span className="font-medium text-graphite-900">{event.utilizador}</span> — {event.titulo.toLowerCase()}
          <span className="ml-1.5 text-graphite-400">· {protocolo}</span>
        </p>
        <p className="mt-0.5 text-2xs text-graphite-400">{event.unidade} · {new Date(event.data).toLocaleString("pt-PT")}</p>
      </div>
    </div>
  );
}
