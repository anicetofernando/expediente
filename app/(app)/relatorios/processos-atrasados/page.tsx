import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableContainer, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/table";
import { PriorityBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { organizationalUnits } from "@/data/organization";
import { requirePermission } from "@/lib/auth";
import { listExpedients } from "@/lib/expedients-db";
import { formatDate } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export const metadata = { title: "Processos atrasados" };

// Data de referência para o cálculo de dias de atraso — corresponde ao dia corrente do sistema.
function diasAtraso(prazo: string): number {
  const diff = (Date.now() - new Date(prazo).getTime()) / 86400000;
  return Math.max(0, Math.floor(diff));
}

function unidadeMaisFrequente(unidades: string[]): string {
  if (unidades.length === 0) return "—";
  const counts = new Map<string, number>();
  unidades.forEach((u) => counts.set(u, (counts.get(u) ?? 0) + 1));
  let best = unidades[0];
  let bestCount = 0;
  counts.forEach((count, key) => {
    if (count > bestCount) {
      bestCount = count;
      best = key;
    }
  });
  return best;
}

export default async function ProcessosAtrasadosPage() {
  const session = await requirePermission(["superior", "administracao"], ["relatorios.ver"]);
  const allExpedients = await listExpedients(session, "all");
  const atrasados = allExpedients
    .filter((e) => e.atrasado === true || e.estado === "atrasado" || e.estado === "expirado")
    .map((e) => ({ ...e, dias: diasAtraso(e.prazo) }))
    .sort((a, b) => b.dias - a.dias);

  const urgentes = atrasados.filter((e) => e.prioridade === "urgente").length;
  const maisDe7Dias = atrasados.filter((e) => e.dias > 7).length;
  const unidadeNome = unidadeMaisFrequente(atrasados.map((e) => e.unidadeOrigem));
  const unidadeSigla = organizationalUnits.find((u) => u.nome === unidadeNome)?.sigla ?? unidadeNome;

  return (
    <div>
      <PageHeader
        title="Processos atrasados"
        description="Expedientes que ultrapassaram o prazo previsto de resposta ou tramitação e que requerem atenção prioritária."
        breadcrumb={[{ label: "Relatórios", href: "/relatorios" }, { label: "Processos atrasados" }]}
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total atrasados" value={atrasados.length} icon="AlertTriangle" tone="crimson" />
          <StatCard label="Atrasados urgentes" value={urgentes} icon="Flame" tone="crimson" />
          <StatCard label="Atrasados há mais de 7 dias" value={maisDe7Dias} icon="CalendarClock" tone="amber" />
          <StatCard label="Unidade mais afectada" value={unidadeSigla} icon="Building2" tone="navy" />
        </div>

        <Card>
          <CardContent className="p-0">
            {atrasados.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Sem processos atrasados"
                description="De momento, todos os expedientes encontram-se dentro do prazo previsto de tramitação."
              />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Protocolo</TableHeaderCell>
                      <TableHeaderCell>Assunto</TableHeaderCell>
                      <TableHeaderCell>Unidade</TableHeaderCell>
                      <TableHeaderCell>Responsável</TableHeaderCell>
                      <TableHeaderCell>Prioridade</TableHeaderCell>
                      <TableHeaderCell>Prazo</TableHeaderCell>
                      <TableHeaderCell className="text-right">Dias de atraso</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {atrasados.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap">
                          <Link href={`/expedientes/${e.id}`} className="font-medium text-navy-700 hover:underline">
                            {e.protocolo}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <span className="line-clamp-1">{e.assunto}</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{e.unidadeOrigem}</TableCell>
                        <TableCell className="whitespace-nowrap">{e.responsavelActual}</TableCell>
                        <TableCell>
                          <PriorityBadge priority={e.prioridade} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">{formatDate(e.prazo)}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-crimson-600">{e.dias} d</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
