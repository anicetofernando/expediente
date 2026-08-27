import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StageAvgTimeChart } from "@/components/dashboard/charts";
import { avgResponseTimeByUnit, coreStats } from "@/lib/dashboard-metrics";
import { requirePermission } from "@/lib/auth";
import { listReportExpedients } from "@/lib/expedients-db";

export const metadata = { title: "Tempos de resposta" };

export default async function TemposRespostaPage() {
  const session = await requirePermission(["superior", "administracao"], ["relatorios.ver"]);
  const expedients = await listReportExpedients(session);
  const stats = coreStats(expedients);
  const porUnidade = avgResponseTimeByUnit(expedients);
  const maisLenta = porUnidade[0];
  const maisRapida = porUnidade[porUnidade.length - 1];
  const maiorMedia = maisLenta?.mediaDias ?? 1;

  return (
    <div>
      <PageHeader
        title="Tempos de resposta"
        description="Análise dos tempos médios de tramitação de expedientes, por etapa do fluxo e por unidade de origem."
        breadcrumb={[{ label: "Relatórios", href: "/relatorios" }, { label: "Tempos de resposta" }]}
      />

      <div className="space-y-6 p-6">
        {/* Resumo */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Tempo médio geral" value={`${stats.tempoMedioDias} d`} icon="Timer" tone="navy" />
          <StatCard
            label={`Unidade mais rápida — ${maisRapida?.unidade ?? "—"}`}
            value={maisRapida ? `${maisRapida.mediaDias} d` : "—"}
            icon="Zap"
            tone="success"
          />
          <StatCard
            label={`Unidade mais lenta — ${maisLenta?.unidade ?? "—"}`}
            value={maisLenta ? `${maisLenta.mediaDias} d` : "—"}
            icon="AlertTriangle"
            tone="crimson"
          />
        </div>

        {/* Tempo médio por etapa */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Tempo médio por etapa do fluxo</CardTitle>
              <CardDescription>Dias médios de permanência em cada fase da tramitação</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <StageAvgTimeChart height={320} expedients={expedients} />
            <p className="mt-4 max-w-3xl text-[13px] leading-relaxed text-graphite-600">
              A fase de <span className="font-medium text-graphite-800">parecer técnico</span> concentra o maior tempo médio de
              permanência do processo, reflectindo a necessidade de coordenação entre unidades para emissão de pareceres
              cruzados. A recepção e o protocolo mantêm-se dentro dos padrões esperados, com tempos residuais inferiores a um
              dia, o que confirma a eficácia do fluxo de entrada implementado pela Secretaria Geral.
            </p>
          </CardContent>
        </Card>

        {/* Tempo médio por unidade */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Tempo médio de resposta por unidade</CardTitle>
              <CardDescription>Calculado sobre processos concluídos (aprovados, arquivados ou com recepção confirmada)</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {porUnidade.map((row) => {
              const pct = Math.max(4, Math.round((row.mediaDias / maiorMedia) * 100));
              return (
                <div key={row.unidade} className="flex items-center gap-4">
                  <div className="w-56 shrink-0">
                    <p className="truncate text-[13px] font-medium text-graphite-800">{row.unidade}</p>
                    <p className="text-2xs text-graphite-400">{row.amostras} processo{row.amostras === 1 ? "" : "s"} concluído{row.amostras === 1 ? "" : "s"}</p>
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-graphite-150">
                    <div
                      className={row.mediaDias >= 6 ? "h-full rounded-full bg-crimson-500" : row.mediaDias >= 3 ? "h-full rounded-full bg-amber-500" : "h-full rounded-full bg-success-500"}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-[13px] font-semibold tabular-nums text-graphite-800">
                    {row.mediaDias.toFixed(1)} d
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
