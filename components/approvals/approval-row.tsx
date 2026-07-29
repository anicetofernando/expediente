import Link from "next/link";
import { Eye } from "lucide-react";
import type { ExpedientStatus, Priority } from "@/types";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { PRIORITY_META, STATUS_META } from "@/lib/status";
import { cn, formatDate } from "@/lib/utils";

export interface ApprovalTableRowData {
  id: string;
  protocolo: string;
  assunto: string;
  estado: ExpedientStatus;
  prioridade: Priority;
  remetente: string;
  unidadeOrigem: string;
  dataEntrada: string;
  prazo: string;
  atrasado: boolean;
}

export function ApprovalRow({ expedient }: { expedient: ApprovalTableRowData }) {
  const href = `/expedientes/${expedient.id}`;
  const status = STATUS_META[expedient.estado];
  const priority = PRIORITY_META[expedient.prioridade];

  return (
    <TableRow className="group hover:bg-graphite-50">
      <TableCell className="w-[142px] py-1.5">
        <Link
          href={href}
          prefetch
          className="whitespace-nowrap font-semibold text-cfm-800 underline-offset-2 hover:text-cfm-950 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfm-500/30"
        >
          {expedient.protocolo}
        </Link>
      </TableCell>
      <TableCell className="min-w-[300px] py-1.5" title={expedient.assunto}>
        <Link
          href={href}
          prefetch
          className="block max-w-[420px] truncate font-medium text-graphite-800 hover:text-cfm-900 hover:underline"
        >
          {expedient.assunto}
        </Link>
      </TableCell>
      <TableCell className="w-[190px] py-1.5">
        <span className="block max-w-[170px] truncate text-graphite-700" title={expedient.remetente}>
          {expedient.remetente}
        </span>
        <span className="block max-w-[170px] truncate text-2xs text-graphite-400" title={expedient.unidadeOrigem}>
          {expedient.unidadeOrigem}
        </span>
      </TableCell>
      <TableCell className="w-[92px] py-1.5">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-graphite-700">
          <span className={cn("size-1.5 rounded-full", priority.dot)} aria-hidden />
          {priority.label}
        </span>
      </TableCell>
      <TableCell className="w-[172px] py-1.5">
        <span
          className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-graphite-700"
          title={status.description}
        >
          <span className={cn("size-1.5 rounded-full", status.dot)} aria-hidden />
          {status.label}
        </span>
      </TableCell>
      <TableCell className="w-[110px] whitespace-nowrap py-1.5 tabular-nums text-graphite-500">
        {formatDate(expedient.dataEntrada)}
      </TableCell>
      <TableCell
        className={cn(
          "w-[110px] whitespace-nowrap py-1.5 tabular-nums",
          expedient.atrasado ? "font-semibold text-crimson-700" : "text-graphite-500"
        )}
      >
        {formatDate(expedient.prazo)}
      </TableCell>
      <TableCell className="w-[54px] py-1.5 text-center">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link
            href={href}
            prefetch
            aria-label={`Ver e decidir ${expedient.protocolo}`}
            title="Ver e decidir"
          >
            <Eye className="size-3.5" aria-hidden />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}
