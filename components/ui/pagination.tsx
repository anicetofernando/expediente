"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  const safeTotal = Math.max(0, total);
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = safeTotal === 0 ? 0 : (currentPage - 1) * safePageSize + 1;
  const end = Math.min(currentPage * safePageSize, safeTotal);

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-col gap-1.5 border-t border-graphite-300 bg-graphite-25 px-3 py-1.5 sm:flex-row sm:items-center sm:justify-between"
    >
      <p aria-atomic="true" aria-live="polite" className="text-xs tabular-nums text-graphite-500">
        <span className="font-medium text-graphite-700">
          {start}–{end}
        </span>{" "}
        de <span className="font-medium text-graphite-700">{safeTotal}</span> registos
      </p>
      <div className="flex flex-wrap items-center gap-2.5">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-xs text-graphite-500">Por página</span>
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger aria-label="Linhas por página" className="h-7 w-16 px-2 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="toolbar"
            size="icon-sm"
            className="hidden sm:inline-flex"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            aria-label="Primeira página"
          >
            <ChevronsLeft className="size-3.5" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="toolbar"
            size="icon-sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-3.5" aria-hidden />
          </Button>
          <span className="min-w-12 whitespace-nowrap px-1 text-center text-xs tabular-nums text-graphite-600">
            {currentPage} / {totalPages}
          </span>
          <Button
            type="button"
            variant="toolbar"
            size="icon-sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Página seguinte"
          >
            <ChevronRight className="size-3.5" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="toolbar"
            size="icon-sm"
            className="hidden sm:inline-flex"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label="Última página"
          >
            <ChevronsRight className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>
    </nav>
  );
}
