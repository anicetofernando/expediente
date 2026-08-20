"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import type { ExpedientStatus } from "@/types";
import { STATUS_META } from "@/lib/status";
import { cn, formatDate } from "@/lib/utils";

type SortKey = "protocolo" | "dataEntrada" | "prazo";
type SortDirection = "asc" | "desc";

export interface ExpedientTableRow {
  id: string;
  protocolo: string;
  assunto: string;
  estado: ExpedientStatus;
  remetente: string;
  responsavelActual: string;
  dataEntrada: string;
  prazo: string;
  atrasado: boolean;
}

interface SortState {
  key: SortKey;
  direction: SortDirection;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function ExpedientTableClient({
  data,
  emptyTitle = "Nenhum expediente encontrado",
  emptyDescription = "Ajuste os filtros ou crie um novo expediente para começar.",
  dense = false,
  initialSearch = "",
}: {
  data: ExpedientTableRow[];
  emptyTitle?: string;
  emptyDescription?: string;
  dense?: boolean;
  initialSearch?: string;
}) {
  const router = useRouter();
  const prefetched = React.useRef(new Set<string>());
  const [search, setSearch] = React.useState(initialSearch);
  const deferredSearch = React.useDeferredValue(search);
  const [statusFilter, setStatusFilter] = React.useState<"todos" | ExpedientStatus>("todos");
  const [sort, setSort] = React.useState<SortState>({ key: "dataEntrada", direction: "desc" });
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  React.useEffect(() => {
    setSearch(initialSearch);
    setPage(1);
  }, [initialSearch]);

  const statusOptions = React.useMemo(
    () =>
      Array.from(new Set(data.map((expedient) => expedient.estado))).sort((left, right) =>
        STATUS_META[left].label.localeCompare(STATUS_META[right].label, "pt")
      ),
    [data]
  );

  const filtered = React.useMemo(() => {
    const query = deferredSearch.trim().toLocaleLowerCase("pt");
    const result = data.filter((expedient) => {
      if (statusFilter !== "todos" && expedient.estado !== statusFilter) return false;
      if (!query) return true;

      return [
        expedient.protocolo,
        expedient.assunto,
        expedient.remetente,
        expedient.responsavelActual,
      ]
        .join(" ")
        .toLocaleLowerCase("pt")
        .includes(query);
    });

    return result.sort((left, right) => {
      const leftValue = left[sort.key];
      const rightValue = right[sort.key];
      const comparison =
        sort.key === "protocolo"
          ? leftValue.localeCompare(rightValue, "pt", { numeric: true })
          : leftValue < rightValue
            ? -1
            : leftValue > rightValue
              ? 1
              : 0;

      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [data, deferredSearch, sort, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const firstIndex = (currentPage - 1) * pageSize;
  const paged = filtered.slice(firstIndex, firstIndex + pageSize);
  const rangeStart = filtered.length === 0 ? 0 : firstIndex + 1;
  const rangeEnd = Math.min(firstIndex + pageSize, filtered.length);
  const cellPadding = dense ? "py-1.5" : "py-2";

  function changeSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
    setPage(1);
  }

  function prefetchOnIntent(href: string) {
    if (prefetched.current.has(href)) return;
    prefetched.current.add(href);
    router.prefetch(href);
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

  return (
    <section
      className="flex h-full min-h-0 flex-col border border-graphite-200 bg-white"
      aria-label="Lista de expedientes"
    >
      <div className="flex shrink-0 flex-col gap-2 border-b border-graphite-200 px-4 py-2 md:flex-row md:items-center">
        <label className="min-w-0 flex-1 md:max-w-2xl">
          <span className="sr-only">Pesquisar expedientes</span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Pesquisar por protocolo, assunto ou remetente"
            autoComplete="off"
            className="h-8 w-full rounded-sm border border-graphite-300 bg-white px-2.5 text-[13px] text-graphite-900 outline-none placeholder:text-graphite-400 hover:border-graphite-400 focus:border-cfm-500 focus:ring-2 focus:ring-cfm-500/20"
          />
        </label>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-graphite-600">
            <span>Estado</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as "todos" | ExpedientStatus);
                setPage(1);
              }}
              className="h-8 max-w-52 rounded-sm border border-graphite-300 bg-white px-2 text-xs text-graphite-800 outline-none hover:border-graphite-400 focus:border-cfm-500 focus:ring-2 focus:ring-cfm-500/20"
            >
              <option value="todos">Todos</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {STATUS_META[status].label}
                </option>
              ))}
            </select>
          </label>

          <span className="ml-auto whitespace-nowrap text-xs tabular-nums text-graphite-500" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "registo" : "registos"}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-52 flex-1 items-center justify-center px-6 py-12 text-center">
          <div className="max-w-sm">
            <p className="text-sm font-semibold text-cfm-900">{emptyTitle}</p>
            {emptyDescription && <p className="mt-1 text-xs leading-5 text-graphite-500">{emptyDescription}</p>}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1110px] border-collapse text-left text-xs leading-5">
            <thead className="sticky top-0 z-10 border-b border-graphite-200 bg-graphite-50">
              <tr>
                <SortableHeader
                  label="Protocolo"
                  sortKey="protocolo"
                  sort={sort}
                  onSort={changeSort}
                  className="w-[150px]"
                />
                <th scope="col" className="min-w-[300px] px-3 py-1.5 text-2xs font-semibold uppercase tracking-wide text-cfm-800">
                  Assunto
                </th>
                <th scope="col" className="w-[170px] px-3 py-1.5 text-2xs font-semibold uppercase tracking-wide text-cfm-800">
                  Remetente
                </th>
                <th scope="col" className="w-[190px] px-3 py-1.5 text-2xs font-semibold uppercase tracking-wide text-cfm-800">
                  Responsável
                </th>
                <th scope="col" className="w-[160px] px-3 py-1.5 text-2xs font-semibold uppercase tracking-wide text-cfm-800">
                  Estado
                </th>
                <SortableHeader
                  label="Entrada"
                  sortKey="dataEntrada"
                  sort={sort}
                  onSort={changeSort}
                  className="w-[112px]"
                />
                <SortableHeader
                  label="Prazo"
                  sortKey="prazo"
                  sort={sort}
                  onSort={changeSort}
                  className="w-[112px]"
                />
                <th
                  scope="col"
                  className="w-16 px-3 py-1.5 text-center text-2xs font-semibold uppercase tracking-wide text-cfm-800"
                >
                  Acções
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-150">
              {paged.map((expedient) => {
                const href = `/expedientes/${expedient.id}`;
                const status = STATUS_META[expedient.estado];

                return (
                  <tr
                    key={expedient.id}
                    tabIndex={0}
                    role="link"
                    aria-label={`Abrir expediente ${expedient.protocolo}: ${expedient.assunto}`}
                    className="group cursor-pointer bg-white transition-colors hover:bg-graphite-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cfm-500"
                    onClick={(event) => openRow(event, href)}
                    onKeyDown={(event) => openRowWithKeyboard(event, href)}
                    onPointerEnter={() => prefetchOnIntent(href)}
                    onPointerDown={() => prefetchOnIntent(href)}
                  >
                    <td className={cn("px-3 align-middle", cellPadding)}>
                      <Link
                        href={href}
                        prefetch={false}
                        className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-cfm-800 underline-offset-2 hover:text-cfm-950 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfm-500/30"
                        aria-label={`Abrir expediente ${expedient.protocolo}`}
                      >
                        {expedient.protocolo}
                      </Link>
                    </td>
                    <td className={cn("px-3 align-middle", cellPadding)} title={expedient.assunto}>
                      <Link
                        href={href}
                        prefetch={false}
                        className="block max-w-[380px] truncate font-medium text-graphite-800 hover:text-cfm-800 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfm-500/30"
                      >
                        {expedient.assunto}
                      </Link>
                    </td>
                    <td className={cn("px-3 align-middle text-graphite-600", cellPadding)} title={expedient.remetente}>
                      <span className="block max-w-[150px] truncate">{expedient.remetente}</span>
                    </td>
                    <td className={cn("px-3 align-middle text-graphite-600", cellPadding)} title={expedient.responsavelActual}>
                      <span className="block max-w-[170px] truncate">{expedient.responsavelActual}</span>
                    </td>
                    <td className={cn("px-3 align-middle", cellPadding)}>
                      <span
                        className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-graphite-700"
                        title={status.description}
                      >
                        <span className={cn("size-1.5 shrink-0 rounded-full", status.dot)} aria-hidden="true" />
                        {status.label}
                      </span>
                    </td>
                    <td className={cn("whitespace-nowrap px-3 align-middle tabular-nums text-graphite-500", cellPadding)}>
                      {formatDate(expedient.dataEntrada)}
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-3 align-middle tabular-nums",
                        cellPadding,
                        expedient.atrasado ? "font-semibold text-crimson-700" : "text-graphite-500"
                      )}
                    >
                      {formatDate(expedient.prazo)}
                    </td>
                    <td className={cn("px-3 text-center align-middle", cellPadding)}>
                      <Link
                        href={href}
                        prefetch={false}
                        title={`Consultar ${expedient.protocolo}`}
                        aria-label={`Consultar expediente ${expedient.protocolo}`}
                        className="inline-flex size-7 items-center justify-center rounded-sm border border-transparent text-graphite-500 hover:border-graphite-300 hover:bg-graphite-50 hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/30"
                      >
                        <Eye className="size-3.5" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex shrink-0 flex-col gap-2 border-t border-graphite-200 px-3 py-2 text-xs text-graphite-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="tabular-nums">
            <span className="font-medium text-graphite-700">
              {rangeStart}–{rangeEnd}
            </span>{" "}
            de <span className="font-medium text-graphite-700">{filtered.length}</span>
          </p>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5">
              <span>Linhas</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="h-7 rounded-sm border border-graphite-300 bg-white px-1.5 text-xs text-graphite-700 outline-none focus:border-cfm-500 focus:ring-2 focus:ring-cfm-500/20"
                aria-label="Linhas por página"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <span className="min-w-12 text-center tabular-nums text-graphite-600">
              {currentPage}/{totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="flex size-7 items-center justify-center rounded-sm border border-graphite-300 bg-white text-base leading-none text-graphite-600 hover:bg-graphite-50 disabled:cursor-not-allowed disabled:border-graphite-200 disabled:text-graphite-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfm-500/30"
              aria-label="Página anterior"
            >
              ‹
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="flex size-7 items-center justify-center rounded-sm border border-graphite-300 bg-white text-base leading-none text-graphite-600 hover:bg-graphite-50 disabled:cursor-not-allowed disabled:border-graphite-200 disabled:text-graphite-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfm-500/30"
              aria-label="Página seguinte"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  const ariaSort = active ? (sort.direction === "asc" ? "ascending" : "descending") : "none";

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn("px-3 py-1.5 text-2xs font-semibold uppercase tracking-wide text-cfm-800", className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 whitespace-nowrap hover:text-cfm-950 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfm-500/30"
      >
        {label}
        <span aria-hidden="true" className={cn("text-[10px]", active ? "text-cfm-700" : "text-graphite-300")}>
          {active ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}
