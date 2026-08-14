import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { coreStats } from "@/lib/dashboard-metrics";
import { requireSession } from "@/lib/auth";
import { listExpedients } from "@/lib/expedients-db";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Painel" };

const TERMINAL_STATES = ["arquivado", "aprovado", "recebimento_confirmado", "cancelado", "rejeitado"];

export default async function PainelPage() {
  const allExpedients = await listExpedients(await requireSession(), "all");
  const stats = coreStats(allExpedients);

  const prioritarios = [...allExpedients]
    .filter((expedient) => !TERMINAL_STATES.includes(expedient.estado))
    .sort((a, b) => {
      if (a.atrasado !== b.atrasado) return a.atrasado ? -1 : 1;
      return new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
    })
    .slice(0, 7);

  const indicadores = [
    { label: "Recebidos", value: stats.recebidos },
    { label: "Pendentes", value: stats.pendentes },
    { label: "Atrasados", value: stats.atrasados, alert: true },
    { label: "Concluídos", value: stats.concluidos },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title="Painel" />

      <div className="space-y-4 p-4 lg:p-5">
        <section
          className="grid overflow-hidden border border-graphite-200 bg-white sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Resumo de expedientes"
        >
          {indicadores.map((indicador, index) => (
            <div
              key={indicador.label}
              className={cn(
                "flex items-baseline justify-between gap-4 px-4 py-3",
                index > 0 && "border-t border-graphite-200",
                index === 1 && "sm:border-l sm:border-t-0",
                index === 2 && "xl:border-l xl:border-t-0",
                index === 3 && "sm:border-l xl:border-t-0"
              )}
            >
              <span className="text-xs font-medium text-graphite-500">{indicador.label}</span>
              <span
                className={cn(
                  "text-xl font-semibold tabular-nums text-cfm-900",
                  indicador.alert && "text-crimson-700"
                )}
              >
                {indicador.value}
              </span>
            </div>
          ))}
        </section>

        <section className="overflow-hidden border border-graphite-200 bg-white">
          <header className="flex min-h-12 items-center justify-between gap-4 border-b border-graphite-200 px-4">
            <h2 className="text-sm font-semibold text-cfm-900">Expedientes prioritários</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/expedientes/pendentes">
                Ver todos
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </header>

          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Protocolo</TableHeaderCell>
                <TableHeaderCell>Assunto</TableHeaderCell>
                <TableHeaderCell className="hidden lg:table-cell">Responsável</TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
                <TableHeaderCell className="text-right">Prazo</TableHeaderCell>
                <TableHeaderCell className="w-10">
                  <span className="sr-only">Abrir</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prioritarios.map((expedient) => (
                <TableRow key={expedient.id}>
                  <TableCell>
                    <Link
                      href={`/expedientes/${expedient.id}`}
                      className="whitespace-nowrap text-xs font-semibold text-cfm-800 hover:underline"
                    >
                      {expedient.protocolo}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[520px]">
                    <span className="block truncate text-[13px] font-medium text-graphite-800">
                      {expedient.assunto}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-graphite-500 lg:hidden">
                      {expedient.responsavelActual}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-[13px] text-graphite-600 lg:table-cell">
                    {expedient.responsavelActual}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={expedient.estado} />
                  </TableCell>
                  <TableCell
                    className={cn(
                      "whitespace-nowrap text-right text-xs tabular-nums text-graphite-600",
                      expedient.atrasado && "font-semibold text-crimson-700"
                    )}
                  >
                    {formatDate(expedient.prazo)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link
                        href={`/expedientes/${expedient.id}`}
                        aria-label={`Consultar ${expedient.protocolo}`}
                        title="Consultar"
                      >
                        <Eye className="size-3.5" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>
    </div>
  );
}
