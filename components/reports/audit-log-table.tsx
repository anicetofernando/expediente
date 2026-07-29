"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableContainer, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import type { AuditEntry } from "@/types";

const RESULTADO_LABEL: Record<AuditEntry["resultado"], string> = {
  sucesso: "Sucesso",
  falha: "Falha",
  bloqueado: "Bloqueado",
};

export function AuditLogTable({ entries }: { entries: AuditEntry[] }) {
  const [query, setQuery] = React.useState("");
  const [resultado, setResultado] = React.useState<string>("todos");
  const [entidade, setEntidade] = React.useState<string>("todas");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const entidades = React.useMemo(() => Array.from(new Set(entries.map((e) => e.entidade))).sort(), [entries]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      const matchesQuery =
        q.length === 0 ||
        e.utilizador.toLowerCase().includes(q) ||
        e.accao.toLowerCase().includes(q) ||
        e.entidade.toLowerCase().includes(q) ||
        e.entidadeId.toLowerCase().includes(q);
      const matchesResultado = resultado === "todos" || e.resultado === resultado;
      const matchesEntidade = entidade === "todas" || e.entidade === entidade;
      return matchesQuery && matchesResultado && matchesEntidade;
    });
  }, [entries, query, resultado, entidade]);

  React.useEffect(() => {
    setPage(1);
  }, [query, resultado, entidade]);

  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return (
    <Card>
      <CardContent className="space-y-4 border-b border-graphite-150 p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput
              placeholder="Pesquisar por utilizador, acção ou entidade…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery("")}
            />
          </div>
          <Select value={resultado} onValueChange={setResultado}>
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os resultados</SelectItem>
              <SelectItem value="sucesso">Sucesso</SelectItem>
              <SelectItem value="falha">Falha</SelectItem>
              <SelectItem value="bloqueado">Bloqueado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={entidade} onValueChange={setEntidade}>
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as entidades</SelectItem>
              {entidades.map((ent) => (
                <SelectItem key={ent} value={ent}>
                  {ent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum registo encontrado" description="Ajuste os filtros ou o termo de pesquisa para ver mais resultados." />
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Data</TableHeaderCell>
                  <TableHeaderCell>Utilizador</TableHeaderCell>
                  <TableHeaderCell>Acção</TableHeaderCell>
                  <TableHeaderCell>Entidade</TableHeaderCell>
                  <TableHeaderCell>Detalhes</TableHeaderCell>
                  <TableHeaderCell>IP</TableHeaderCell>
                  <TableHeaderCell>Resultado</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap tabular-nums">{formatDate(entry.data, true)}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium text-graphite-900">{entry.utilizador}</TableCell>
                    <TableCell className="whitespace-nowrap">{entry.accao}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="text-graphite-700">{entry.entidade}</span>
                      <span className="ml-1 text-2xs text-graphite-400">{entry.entidadeId}</span>
                    </TableCell>
                    <TableCell className="max-w-sm text-graphite-600">{entry.detalhes}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-graphite-500">{entry.ip}</TableCell>
                    <TableCell>
                      <Badge variant={entry.resultado === "sucesso" ? "success" : "crimson"}>
                        {RESULTADO_LABEL[entry.resultado]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </>
      )}
    </Card>
  );
}
