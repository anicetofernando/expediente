"use client";

import * as React from "react";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import {
  ApprovalRow,
  type ApprovalTableRowData,
} from "@/components/approvals/approval-row";

type Situation =
  | "todas"
  | "urgentes"
  | "atrasadas"
  | "parecer"
  | "esclarecimento"
  | "analise";

export function ApprovalTable({ items }: { items: ApprovalTableRowData[] }) {
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search);
  const [situation, setSituation] = React.useState<Situation>("todas");

  const filtered = React.useMemo(() => {
    const query = deferredSearch.trim().toLocaleLowerCase("pt");

    return items
      .filter((expedient) => {
        if (situation === "urgentes" && expedient.prioridade !== "urgente") return false;
        if (situation === "atrasadas" && !expedient.atrasado && expedient.estado !== "atrasado") return false;
        if (situation === "parecer" && expedient.estado !== "aguardando_parecer") return false;
        if (situation === "esclarecimento" && expedient.estado !== "aguardando_esclarecimento") return false;
        if (situation === "analise" && expedient.estado !== "em_analise") return false;

        if (!query) return true;
        return [
          expedient.protocolo,
          expedient.assunto,
          expedient.remetente,
          expedient.unidadeOrigem,
        ]
          .join(" ")
          .toLocaleLowerCase("pt")
          .includes(query);
      })
      .sort((left, right) => new Date(left.prazo).getTime() - new Date(right.prazo).getTime());
  }, [deferredSearch, items, situation]);

  return (
    <section className="flex min-h-0 flex-1 flex-col border border-graphite-200 bg-white">
      <div className="flex shrink-0 flex-col gap-2 border-b border-graphite-200 px-3 py-2 md:flex-row md:items-center">
        <label className="relative min-w-0 flex-1 md:max-w-xl">
          <span className="sr-only">Pesquisar aprovações</span>
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-graphite-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar protocolo, assunto ou remetente"
            autoComplete="off"
            className="h-8 w-full rounded-sm border border-graphite-300 bg-white pl-8 pr-2.5 text-[13px] text-graphite-900 outline-none placeholder:text-graphite-400 hover:border-graphite-400 focus:border-cfm-500 focus:ring-2 focus:ring-cfm-500/20"
          />
        </label>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-graphite-600">
            <span>Situação</span>
            <select
              value={situation}
              onChange={(event) => setSituation(event.target.value as Situation)}
              className="h-8 rounded-sm border border-graphite-300 bg-white px-2 text-xs text-graphite-800 outline-none hover:border-graphite-400 focus:border-cfm-500 focus:ring-2 focus:ring-cfm-500/20"
            >
              <option value="todas">Todas</option>
              <option value="urgentes">Urgentes</option>
              <option value="atrasadas">Atrasadas</option>
              <option value="parecer">Aguardando parecer</option>
              <option value="esclarecimento">Aguardando esclarecimento</option>
              <option value="analise">Em análise</option>
            </select>
          </label>
          <span className="ml-auto whitespace-nowrap text-xs tabular-nums text-graphite-500" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "registo" : "registos"}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-48 flex-1 items-center justify-center px-6 py-10 text-center">
          <p className="text-sm font-medium text-graphite-700">Sem aprovações para apresentar</p>
        </div>
      ) : (
        <TableContainer className="min-h-0 flex-1">
          <Table className="min-w-[1080px]">
            <TableHead>
              <TableRow>
                <TableHeaderCell className="w-[142px]">Protocolo</TableHeaderCell>
                <TableHeaderCell className="min-w-[300px]">Assunto</TableHeaderCell>
                <TableHeaderCell className="w-[190px]">Remetente / unidade</TableHeaderCell>
                <TableHeaderCell className="w-[92px]">Prioridade</TableHeaderCell>
                <TableHeaderCell className="w-[172px]">Estado</TableHeaderCell>
                <TableHeaderCell className="w-[110px]">Entrada</TableHeaderCell>
                <TableHeaderCell className="w-[110px]">Prazo</TableHeaderCell>
                <TableHeaderCell className="w-[54px] text-center">Acções</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((expedient) => (
                <ApprovalRow key={expedient.id} expedient={expedient} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </section>
  );
}
