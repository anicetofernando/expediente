"use client";

import * as React from "react";
import Link from "next/link";
import { Paperclip, FileSearch2 } from "lucide-react";
import { SearchInput } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { ConfidentialityBadge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import type { FlatDocument } from "./document-library";

export function AttachmentsTable({ documents }: { documents: FlatDocument[] }) {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const filtered = React.useMemo(() => {
    let list = documents;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((d) => d.nome.toLowerCase().includes(q) || d.protocolo.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }, [documents, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="border-b border-graphite-150 bg-white px-4 py-3">
        <div className="w-full sm:w-72">
          <SearchInput
            placeholder="Pesquisar por nome ou protocolo…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            onClear={() => setSearch("")}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileSearch2} title="Nenhum anexo encontrado" description="Ajuste a pesquisa para encontrar o anexo pretendido." />
      ) : (
        <TableContainer className="flex-1">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="min-w-[240px]">Nome</TableHeaderCell>
                <TableHeaderCell>Protocolo do processo</TableHeaderCell>
                <TableHeaderCell>Tamanho</TableHeaderCell>
                <TableHeaderCell>Confidencialidade</TableHeaderCell>
                <TableHeaderCell>Criado em</TableHeaderCell>
                <TableHeaderCell>Criado por</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((doc) => (
                <TableRow key={`${doc.expedienteId}-${doc.id}`}>
                  <TableCell className="max-w-[280px]">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-graphite-100 text-graphite-500">
                        <Paperclip className="size-3.5" />
                      </span>
                      <span className="truncate font-medium text-graphite-800" title={doc.nome}>{doc.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Link href={`/expedientes/${doc.expedienteId}`} className="font-medium text-navy-700 hover:underline">
                      {doc.protocolo}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums text-graphite-500">{doc.tamanho}</TableCell>
                  <TableCell><ConfidentialityBadge level={doc.confidencialidade} /></TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums text-graphite-500">{formatDate(doc.criadoEm)}</TableCell>
                  <TableCell className="whitespace-nowrap">{doc.criadoPor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {filtered.length > 0 && (
        <Pagination page={pageSafe} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      )}
    </div>
  );
}
