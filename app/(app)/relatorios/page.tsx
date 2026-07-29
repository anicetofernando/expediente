import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { coreStats } from "@/lib/dashboard-metrics";
import {
  StatusDistributionChart,
  TypeDistributionChart,
  SectorDistributionChart,
  MonthlyTrendChart,
  StageAvgTimeChart,
  DeadlineComplianceChart,
} from "@/components/dashboard/charts";
import { ExportReportButton, PeriodSelect } from "@/components/reports/report-controls";

export const metadata = { title: "Visão estatística" };

export default function RelatoriosPage() {
  const stats = coreStats();

  return (
    <div>
      <PageHeader
        title="Visão estatística"
        description="Panorama consolidado da actividade de expediente da CFM: volume, distribuição, tempos de tramitação e cumprimento de prazos."
        breadcrumb={[{ label: "Relatórios" }]}
        actions={<ExportReportButton />}
      />

      <div className="space-y-6 p-6">
        {/* Indicadores principais */}
        <div>
          <h2 className="mb-3 text-[15px] font-semibold text-graphite-900">Indicadores principais</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
            <StatCard label="Recebidos" value={stats.recebidos} icon="Inbox" tone="navy" />
            <StatCard label="Pendentes" value={stats.pendentes} icon="Clock3" tone="info" />
            <StatCard label="Aguardando aprovação" value={stats.aguardandoAprovacao} icon="ClipboardCheck" tone="amber" />
            <StatCard label="Devolvidos" value={stats.devolvidos} icon="Undo2" tone="crimson" />
            <StatCard label="Atrasados" value={stats.atrasados} icon="AlertTriangle" tone="crimson" />
            <StatCard label="Concluídos" value={stats.concluidos} icon="CheckCircle2" tone="success" />
            <StatCard label="Tempo médio" value={`${stats.tempoMedioDias} d`} icon="Timer" tone="graphite" />
          </div>
        </div>

        {/* Distribuição e tendências */}
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-graphite-900">Distribuição e tendências</h2>
              <p className="text-[13px] text-graphite-500">Análise por estado, tipo, sector, tempo de tramitação e cumprimento de prazos.</p>
            </div>
            <PeriodSelect />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Expedientes por estado</CardTitle>
                  <CardDescription>Distribuição actual por grupo de estado</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <StatusDistributionChart height={260} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Expedientes por tipo</CardTitle>
                  <CardDescription>Volume por tipologia documental</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <TypeDistributionChart height={260} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Distribuição por sector</CardTitle>
                  <CardDescription>Unidades de origem com maior volume</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <SectorDistributionChart height={260} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <div>
                  <CardTitle>Evolução mensal</CardTitle>
                  <CardDescription>Processos recebidos vs. concluídos, últimos 6 meses</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <MonthlyTrendChart height={260} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Tempo médio por etapa</CardTitle>
                  <CardDescription>Dias médios de permanência</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <StageAvgTimeChart height={260} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <div>
                  <CardTitle>Cumprimento de prazos</CardTitle>
                  <CardDescription>Percentagem de processos concluídos dentro e fora do prazo, por mês</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <DeadlineComplianceChart height={260} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
