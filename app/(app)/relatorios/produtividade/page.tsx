import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableContainer, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/table";
import { UserAvatar } from "@/components/ui/avatar";
import { TopProductivityChart } from "@/components/dashboard/charts";
import { productivityByUser } from "@/lib/dashboard-metrics";
import { requirePermission } from "@/lib/auth";
import { listExpedients } from "@/lib/expedients-db";

export const metadata = { title: "Produtividade" };

export default async function ProdutividadePage() {
  const session = await requirePermission(["superior", "administracao"], ["relatorios.ver"]);
  const expedients = await listExpedients(session, "all");
  const linhas = productivityByUser(expedients);
  const maxConcluidos = Math.max(1, ...linhas.map((l) => l.concluidos));

  const totalConcluidos = linhas.reduce((sum, l) => sum + l.concluidos, 0);
  const totalEmCurso = linhas.reduce((sum, l) => sum + l.emCurso, 0);
  const tempoMedioGlobal =
    linhas.reduce((sum, l) => sum + l.tempoMedioDias * l.concluidos, 0) / (totalConcluidos || 1);

  return (
    <div>
      <PageHeader
        title="Produtividade"
        description="Desempenho de tramitação por utilizador responsável: processos concluídos, em curso e tempo médio de resolução."
        breadcrumb={[{ label: "Relatórios", href: "/relatorios" }, { label: "Produtividade" }]}
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Colaboradores avaliados" value={linhas.length} icon="Users2" tone="navy" />
          <StatCard label="Processos concluídos (total)" value={totalConcluidos} icon="CheckCircle2" tone="success" />
          <StatCard label="Tempo médio de resolução" value={`${tempoMedioGlobal.toFixed(1)} d`} icon="Timer" tone="graphite" />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top colaboradores por processos concluídos</CardTitle>
              <CardDescription>Os 6 utilizadores com maior número de processos concluídos</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <TopProductivityChart height={260} expedients={expedients} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Detalhe por utilizador</CardTitle>
              <CardDescription>
                Tempo médio calculado apenas sobre processos concluídos ({totalEmCurso} processos permanecem em curso)
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Utilizador</TableHeaderCell>
                    <TableHeaderCell>Unidade</TableHeaderCell>
                    <TableHeaderCell className="text-right">Concluídos</TableHeaderCell>
                    <TableHeaderCell className="text-right">Em curso</TableHeaderCell>
                    <TableHeaderCell className="text-right">Tempo médio</TableHeaderCell>
                    <TableHeaderCell>Desempenho</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {linhas.map((l) => {
                    const pct = Math.max(4, Math.round((l.concluidos / maxConcluidos) * 100));
                    return (
                      <TableRow key={l.userId}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <UserAvatar name={l.nome} color={l.avatarColor} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-graphite-900">{l.nome}</p>
                              <p className="truncate text-2xs text-graphite-500">{l.cargo}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{l.unidade}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-graphite-900">{l.concluidos}</TableCell>
                        <TableCell className="text-right tabular-nums">{l.emCurso}</TableCell>
                        <TableCell className="text-right tabular-nums">{l.tempoMedioDias.toFixed(1)} d</TableCell>
                        <TableCell>
                          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-graphite-150">
                            <div className="h-full rounded-full bg-navy-600" style={{ width: `${pct}%` }} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
