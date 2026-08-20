"use client";

import * as React from "react";
import Link from "next/link";
import { Stamp, PenTool, FileText, FileSearch2 } from "lucide-react";
import type { ExpedientDocument } from "@/types";
import { SearchInput } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { ConfidentialityBadge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DocumentViewer } from "@/components/documents/document-viewer";
import { formatDate } from "@/lib/utils";

export type FlatDocument = ExpedientDocument & { protocolo: string; expedienteId: string; assunto: string };

const TIPO_OPTIONS: { value: FlatDocument["tipo"]; label: string }[] = [
  { value: "principal", label: "Principal" },
  { value: "anexo", label: "Anexo" },
  { value: "parecer", label: "Parecer" },
  { value: "despacho", label: "Despacho" },
  { value: "resposta", label: "Resposta" },
];

const FORMATO_OPTIONS: { value: FlatDocument["formato"]; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "DOCX" },
  { value: "imagem", label: "Imagem" },
];

export function DocumentLibrary({ documents }: { documents: FlatDocument[] }) {
  const [search, setSearch] = React.useState("");
  const [tipoFilter, setTipoFilter] = React.useState("todos");
  const [formatoFilter, setFormatoFilter] = React.useState("todos");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [preview, setPreview] = React.useState<FlatDocument | null>(null);

  const filtered = React.useMemo(() => {
    let list = documents;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((d) => d.nome.toLowerCase().includes(q) || d.protocolo.toLowerCase().includes(q));
    }
    if (tipoFilter !== "todos") list = list.filter((d) => d.tipo === tipoFilter);
    if (formatoFilter !== "todos") list = list.filter((d) => d.formato === formatoFilter);
    return [...list].sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }, [documents, search, tipoFilter, formatoFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-3 border-b border-graphite-150 bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="w-full sm:w-64">
            <SearchInput
              placeholder="Pesquisar por nome ou protocolo…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onClear={() => setSearch("")}
            />
          </div>
          <Select value={tipoFilter} onValueChange={(v) => { setTipoFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {TIPO_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={formatoFilter} onValueChange={(v) => { setFormatoFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Formato" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os formatos</SelectItem>
              {FORMATO_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileSearch2} title="Nenhum documento encontrado" description="Ajuste os filtros de pesquisa para encontrar o documento pretendido." />
      ) : (
        <TableContainer className="flex-1">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="min-w-[220px]">Nome</TableHeaderCell>
                <TableHeaderCell>Protocolo</TableHeaderCell>
                <TableHeaderCell>Tipo</TableHeaderCell>
                <TableHeaderCell>Formato</TableHeaderCell>
                <TableHeaderCell>Páginas</TableHeaderCell>
                <TableHeaderCell>Tamanho</TableHeaderCell>
                <TableHeaderCell>Confidencialidade</TableHeaderCell>
                <TableHeaderCell>Carimbo / Assinatura</TableHeaderCell>
                <TableHeaderCell>Criado em</TableHeaderCell>
                <TableHeaderCell>Criado por</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((doc) => (
                <TableRow key={`${doc.expedienteId}-${doc.id}`}>
                  <TableCell className="max-w-[260px]">
                    <button
                      type="button"
                      onClick={() => setPreview(doc)}
                      className="flex w-full items-center gap-2.5 text-left"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-graphite-100 text-graphite-500">
                        <FileText className="size-3.5" />
                      </span>
                      <span className="truncate font-medium text-navy-700 hover:underline" title={doc.nome}>{doc.nome}</span>
                    </button>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Link href={`/expedientes/${doc.expedienteId}`} className="font-medium text-navy-700 hover:underline">
                      {doc.protocolo}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap capitalize">{doc.tipo}</TableCell>
                  <TableCell className="whitespace-nowrap uppercase">{doc.formato}</TableCell>
                  <TableCell className="tabular-nums">{doc.paginas}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums text-graphite-500">{doc.tamanho}</TableCell>
                  <TableCell><ConfidentialityBadge level={doc.confidencialidade} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {doc.carimbado && (
                        <SimpleTooltip label="Documento carimbado">
                          <Stamp className="size-3.5 text-navy-600" />
                        </SimpleTooltip>
                      )}
                      {doc.assinado && (
                        <SimpleTooltip label="Documento assinado digitalmente">
                          <PenTool className="size-3.5 text-success-600" />
                        </SimpleTooltip>
                      )}
                      {!doc.carimbado && !doc.assinado && <span className="text-graphite-300">—</span>}
                    </div>
                  </TableCell>
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

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent size="xl" className="h-[94vh] w-[96vw] max-w-[1600px] p-0">
          {preview && (
            <div className="flex h-full min-h-0 flex-col pt-8">
              <DocumentViewer document={preview} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
