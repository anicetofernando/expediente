import { NextRequest, NextResponse } from "next/server";
import { audit, getCurrentSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { listReportExpedients } from "@/lib/expedients-db";
import {
  coreStats,
  deadlineCompliance,
  filterByPeriod,
  filterByStatusGroup,
  monthlyTrend,
  PERIOD_OPTIONS,
  sectorDistribution,
  stageAvgTime,
  STATUS_GROUPS,
  statusDistribution,
  typeDistribution,
} from "@/lib/dashboard-metrics";
import { buildReportHtml } from "@/lib/report-pdf";
import { renderHtmlPdf } from "@/lib/document-pdf";

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session || !["superior", "administracao"].includes(session.perfilNavegacao)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
  if (!hasPermission(session.profile.permissoes, ["relatorios.ver"])) {
    return NextResponse.json({ error: "Sem permissão para ver relatórios." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const estadoParam = searchParams.get("estado") ?? "todos";
  const periodoParam = searchParams.get("periodo") ?? "6m";
  const estado = STATUS_GROUPS.includes(estadoParam as (typeof STATUS_GROUPS)[number]) ? estadoParam : "todos";
  const periodo = PERIOD_OPTIONS.some((p) => p.value === periodoParam) ? periodoParam : "6m";

  try {
    const allExpedients = await listReportExpedients(session);
    const expedients = filterByStatusGroup(filterByPeriod(allExpedients, periodo), estado);
    const stats = coreStats(expedients);

    const html = buildReportHtml({
      institutionName: "CFM — Portos e Caminhos de Ferro de Moçambique",
      generatedByName: session.user.nome,
      generatedByCargo: session.user.cargo,
      generatedAt: new Date(),
      estadoLabel: estado === "todos" ? "Todos os estatutos" : estado,
      periodoLabel: PERIOD_OPTIONS.find((p) => p.value === periodo)?.label ?? periodo,
      totalExpedientes: expedients.length,
      stats,
      statusDist: statusDistribution(expedients),
      typeDist: typeDistribution(expedients),
      sectorDist: sectorDistribution(expedients),
      monthly: monthlyTrend(expedients),
      stageAvg: stageAvgTime(expedients),
      deadlineCompliance: deadlineCompliance(expedients),
    });

    const pdf = await renderHtmlPdf(html);

    await audit({
      userId: session.user.id,
      action: "Relatório exportado em PDF",
      entityType: "Relatorio",
      entityId: "visao-estatistica",
      details: { estado, periodo, totalExpedientes: expedients.length },
    });

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-cfm-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível gerar o relatório." },
      { status: 500 }
    );
  }
}
