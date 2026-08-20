"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, FileSearch2, Lock, X } from "lucide-react";
import type { LivroEntry } from "@/types";
import { SearchInput } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TableContainer, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { STATUS_META } from "@/lib/status";

export interface LivroRow extends LivroEntry {
  expedientId: string;
}

const MESES = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

export function LivroBoard({ rows }: { rows: LivroRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = React.useState("");
  const [month, setMonth] = React.useState("todos");
  const [year, setYear] = React.useState("todos");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [fechoOpen, setFechoOpen] = React.useState(false);
  const [fechoLoading, setFechoLoading] = React.useState(false);

  const years = React.useMemo(() => {
    const set = new Set(rows.map((r) => String(new Date(r.data).getFullYear())));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = React.useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) => r.protocolo.toLowerCase().includes(q) || r.assunto.toLowerCase().includes(q) || r.remetente.toLowerCase().includes(q)
      );
    }
    if (month !== "todos") list = list.filter((r) => String(new Date(r.data).getMonth() + 1).padStart(2, "0") === month);
    if (year !== "todos") list = list.filter((r) => String(new Date(r.data).getFullYear()) === year);
    return list;
  }, [rows, search, month, year]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const hasFilters = search.trim() !== "" || month !== "todos" || year !== "todos";

  function clearFilters() {
    setSearch("");
    setMonth("todos");
    setYear("todos");
    setPage(1);
  }

  function openRow(event: React.MouseEvent<HTMLTableRowElement>, href: string) {
    if ((event.target as HTMLElement).closest("a, button, input, select, textarea, [role='button']")) return;
    router.push(href);
  }

  function openRowWithKeyboard(event: React.KeyboardEvent<HTMLTableRowElement>, href: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if ((event.target as HTMLElement).closest("a, button, input, select, textarea, [role='button']")) return;
    event.preventDefault();
    router.push(href);
  }

  async function handleFechoMensal() {
    setFechoLoading(true);
    const period=new Date().toISOString().slice(0,7);
    const response=await fetch("/api/book/close",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({period})});
    if(response.ok){
      toast({
        title: "Mês encerrado",
        description: "Os registos do período ficaram disponíveis apenas para consulta.",
        variant: "success",
      });
      setFechoLoading(false);
      setFechoOpen(false);
    }else{
      setFechoLoading(false);
      toast({title:"Não foi possível encerrar o mês",variant:"destructive"});
    }
  }

  return (
      <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-2 border-b border-graphite-200 bg-white px-4 py-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="w-full sm:w-72">
            <SearchInput
              placeholder="Pesquisar por protocolo, assunto, remetente…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onClear={() => setSearch("")}
            />
          </div>
          <Select
            value={month}
            onValueChange={(v) => {
              setMonth(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os meses</SelectItem>
              {MESES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={year}
            onValueChange={(v) => {
              setYear(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[110px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os anos</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={clearFilters}
              aria-label="Limpar filtros"
              title="Limpar filtros"
            >
              <X className="size-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="mr-2 text-xs tabular-nums text-graphite-500">
            {filtered.length} {filtered.length === 1 ? "registo" : "registos"}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setFechoOpen(true)}
            aria-label="Fecho mensal"
            title="Fecho mensal"
          >
            <Lock className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileSearch2} title="Sem registos" description="Não foram encontrados registos para os filtros seleccionados." />
      ) : (
        <>
          <TableContainer className="flex-1">
            <Table className="min-w-[1320px]">
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="w-14">Nº</TableHeaderCell>
                  <TableHeaderCell>Protocolo</TableHeaderCell>
                  <TableHeaderCell>Data</TableHeaderCell>
                  <TableHeaderCell>Origem</TableHeaderCell>
                  <TableHeaderCell>Remetente</TableHeaderCell>
                  <TableHeaderCell className="min-w-[260px]">Assunto</TableHeaderCell>
                  <TableHeaderCell>Destinatário</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell>Data de saída</TableHeaderCell>
                  <TableHeaderCell>Recebido por</TableHeaderCell>
                  <TableHeaderCell className="w-16 text-center">Acções</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((row) => {
                  const status = STATUS_META[row.estado];
                  const href = `/expedientes/${row.expedientId}`;

                  return (
                    <TableRow
                      key={row.numeroSequencial}
                      clickable
                      tabIndex={0}
                      role="link"
                      aria-label={`Abrir expediente ${row.protocolo}: ${row.assunto}`}
                      className="bg-white hover:bg-graphite-50"
                      onClick={(event) => openRow(event, href)}
                      onKeyDown={(event) => openRowWithKeyboard(event, href)}
                      onPointerEnter={() => router.prefetch(href)}
                      onPointerDown={() => router.prefetch(href)}
                    >
                      <TableCell className="tabular-nums text-graphite-500">{row.numeroSequencial}</TableCell>
                      <TableCell className="whitespace-nowrap font-semibold text-cfm-900">{row.protocolo}</TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums text-graphite-500">{formatDate(row.data)}</TableCell>
                      <TableCell className="whitespace-nowrap">{row.origem}</TableCell>
                      <TableCell className="whitespace-nowrap">{row.remetente}</TableCell>
                      <TableCell className="max-w-[320px] truncate" title={row.assunto}>
                        {row.assunto}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{row.destinatario}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-graphite-700" title={status.description}>
                          <span className={`size-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums text-graphite-500">
                        {row.dataSaida ? formatDate(row.dataSaida) : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{row.recebidoPor ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Link
                            href={href}
                            prefetch={false}
                            aria-label={`Abrir expediente ${row.protocolo}`}
                            title="Abrir expediente"
                            className="inline-flex size-7 items-center justify-center rounded-sm text-graphite-600 hover:bg-graphite-100 hover:text-cfm-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cfm-500"
                          >
                            <Eye className="size-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Pagination
            page={pageSafe}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        </>
      )}

      <ConfirmDialog
        open={fechoOpen}
        onOpenChange={setFechoOpen}
        title="Fecho mensal do livro"
        description="O mês corrente será encerrado e ficará disponível apenas para consulta."
        confirmLabel="Confirmar fecho"
        onConfirm={handleFechoMensal}
        loading={fechoLoading}
      />
    </div>
  );
}
