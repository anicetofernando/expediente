import Link from "next/link";
import { Eye, Inbox } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { allExpedients } from "@/data/expedients";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { PRIORITY_META, STATUS_META } from "@/lib/status";
import { ProtocolarDialog } from "@/components/secretariat/protocolar-dialog";

export const metadata = { title: "Recepção — Secretaria" };

export default function SecretariaRecepcaoPage() {
  const porReceber = allExpedients.filter((e) => e.estado === "submetido");
  const porProtocolar = allExpedients.filter((e) => e.estado === "recebido");

  const fila = [...porReceber, ...porProtocolar].sort(
    (a, b) => new Date(a.dataEntrada).getTime() - new Date(b.dataEntrada).getTime()
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Recepção"
        breadcrumb={[{ label: "Secretaria" }, { label: "Recepção" }]}
      />

      <div className="min-h-0 flex-1 bg-graphite-50 p-3 lg:p-4">
        <section className="flex min-h-0 flex-col border border-graphite-200 bg-white" aria-label="Fila de recepção">
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-graphite-200 px-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-cfm-900">Fila de recepção</h2>
            <span className="text-xs tabular-nums text-graphite-500">
              {fila.length} {fila.length === 1 ? "registo" : "registos"}
            </span>
          </div>

          {fila.length === 0 ? (
            <EmptyState icon={Inbox} title="Fila vazia" description="Não existem documentos pendentes." />
          ) : (
            <TableContainer className="min-h-0 flex-1">
              <Table className="min-w-[1040px]">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell className="w-[150px]">Protocolo</TableHeaderCell>
                    <TableHeaderCell className="w-[110px]">Entrada</TableHeaderCell>
                    <TableHeaderCell className="w-[190px]">Remetente</TableHeaderCell>
                    <TableHeaderCell className="min-w-[300px]">Assunto</TableHeaderCell>
                    <TableHeaderCell className="w-[130px]">Prioridade</TableHeaderCell>
                    <TableHeaderCell className="w-[150px]">Estado</TableHeaderCell>
                    <TableHeaderCell className="w-[130px]">Em espera</TableHeaderCell>
                    <TableHeaderCell className="w-[82px] text-center">Acções</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fila.map((exp) => {
                    const status = STATUS_META[exp.estado];
                    const priority = PRIORITY_META[exp.prioridade];

                    return (
                      <TableRow key={exp.id} className="hover:bg-graphite-50">
                        <TableCell className="whitespace-nowrap font-semibold">
                          <Link
                            href={`/expedientes/${exp.id}`}
                            prefetch
                            className="text-cfm-800 underline-offset-2 hover:text-cfm-950 hover:underline"
                          >
                            {exp.protocolo}
                          </Link>
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums text-graphite-500">
                          {formatDate(exp.dataEntrada)}
                        </TableCell>
                        <TableCell>
                          <span className="block max-w-[180px] truncate font-medium text-graphite-800" title={exp.remetente.nome}>
                            {exp.remetente.nome}
                          </span>
                          <span className="block max-w-[180px] truncate text-2xs text-graphite-500" title={exp.unidadeOrigem}>
                            {exp.unidadeOrigem}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[360px] truncate font-medium text-graphite-800" title={exp.assunto}>
                          {exp.assunto}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-graphite-700">
                            <span className={`size-1.5 rounded-full ${priority.dot}`} aria-hidden="true" />
                            {priority.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-graphite-700" title={status.description}>
                            <span className={`size-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-graphite-500">
                          {formatRelativeTime(exp.dataEntrada)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-0.5">
                            <Link
                              href={`/expedientes/${exp.id}`}
                              prefetch
                              aria-label={`Abrir expediente ${exp.protocolo}`}
                              title="Abrir expediente"
                              className="inline-flex size-7 items-center justify-center rounded-sm text-graphite-600 hover:bg-graphite-100 hover:text-cfm-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cfm-500"
                            >
                              <Eye className="size-3.5" aria-hidden="true" />
                            </Link>
                            {exp.estado === "recebido" && <ProtocolarDialog expedient={exp} iconTrigger />}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </section>
      </div>
    </div>
  );
}
