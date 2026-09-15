function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export interface ReportPdfInput {
  institutionName: string;
  generatedByName: string;
  generatedByCargo: string;
  generatedAt: Date;
  estadoLabel: string;
  periodoLabel: string;
  totalExpedientes: number;
  stats: {
    recebidos: number;
    pendentes: number;
    aguardandoAprovacao: number;
    devolvidos: number;
    atrasados: number;
    concluidos: number;
    tempoMedioDias: string;
  };
  statusDist: { name: string; value: number; color?: string }[];
  typeDist: { name: string; value: number }[];
  sectorDist: { name: string; value: number }[];
  monthly: { name: string; recebidos: number; concluidos: number }[];
  stageAvg: { name: string; dias: number }[];
  deadlineCompliance: { name: string; noPrazo: number; atrasado: number }[];
}

function pct(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function distributionTable(title: string, rows: { name: string; value: number; color?: string }[], total: number) {
  if (rows.length === 0) {
    return `<section class="block"><h2>${escapeHtml(title)}</h2><p class="empty">Sem dados para os filtros seleccionados.</p></section>`;
  }
  const body = rows
    .map(
      (row) =>
        `<tr><td>${row.color ? `<span class="dot" style="background:${escapeHtml(row.color)}"></span>` : ""}${escapeHtml(row.name)}</td><td class="num">${row.value}</td><td class="num">${pct(row.value, total)}</td></tr>`
    )
    .join("");
  return `<section class="block"><h2>${escapeHtml(title)}</h2><table><thead><tr><th>Categoria</th><th class="num">Quantidade</th><th class="num">%</th></tr></thead><tbody>${body}</tbody></table></section>`;
}

export function buildReportHtml(input: ReportPdfInput) {
  const dateLabel = input.generatedAt.toLocaleString("pt-PT", { dateStyle: "long", timeStyle: "short" });

  const kpis = [
    { label: "Recebidos", value: input.stats.recebidos },
    { label: "Pendentes", value: input.stats.pendentes },
    { label: "Aguardando aprovação", value: input.stats.aguardandoAprovacao },
    { label: "Devolvidos", value: input.stats.devolvidos },
    { label: "Atrasados", value: input.stats.atrasados },
    { label: "Concluídos", value: input.stats.concluidos },
    { label: "Tempo médio de tramitação", value: `${input.stats.tempoMedioDias} dias` },
  ];
  const kpiHtml = kpis
    .map((kpi) => `<div class="kpi"><span class="kpi-value">${escapeHtml(String(kpi.value))}</span><span class="kpi-label">${escapeHtml(kpi.label)}</span></div>`)
    .join("");

  const monthlyRows = input.monthly.length
    ? input.monthly
        .map((m) => `<tr><td>${escapeHtml(m.name)}</td><td class="num">${m.recebidos}</td><td class="num">${m.concluidos}</td></tr>`)
        .join("")
    : `<tr><td colspan="3" class="empty">Sem dados para os filtros seleccionados.</td></tr>`;

  const stageRows = input.stageAvg.length
    ? input.stageAvg.map((s) => `<tr><td>${escapeHtml(s.name)}</td><td class="num">${s.dias.toFixed(1)} d</td></tr>`).join("")
    : `<tr><td colspan="2" class="empty">Sem dados para os filtros seleccionados.</td></tr>`;

  const deadlineRows = input.deadlineCompliance.length
    ? input.deadlineCompliance
        .map((d) => `<tr><td>${escapeHtml(d.name)}</td><td class="num">${d.noPrazo}%</td><td class="num">${d.atrasado}%</td></tr>`)
        .join("")
    : `<tr><td colspan="3" class="empty">Sem dados para os filtros seleccionados.</td></tr>`;

  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>Relatório de actividade — CFM</title><style>
    @page{size:A4;margin:18mm 17mm 20mm}
    *{box-sizing:border-box}
    html,body{margin:0;padding:0;color:#1f2937;font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;line-height:1.5}
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    header.institutional-header{margin:0 0 8mm;padding:0 0 5mm;border-bottom:1px solid #cad1dc;text-align:center}
    header.institutional-header strong{display:block;color:#102f56;font-size:10pt;letter-spacing:.09em;text-transform:uppercase}
    header.institutional-header span{display:block;margin-top:2mm;color:#687386;font-size:8.5pt}
    h1{margin:0 0 1mm;font-size:15pt;color:#102f56}
    .subtitle{margin:0 0 6mm;color:#556070;font-size:9pt}
    .meta{display:flex;flex-wrap:wrap;gap:4mm 10mm;margin-bottom:7mm;padding:3mm 4mm;background:#f3f5f8;border:1px solid #e1e6ec;font-size:8.5pt;color:#3c4655}
    .meta strong{color:#1f2937}
    .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-bottom:8mm}
    .kpi{border:1px solid #e1e6ec;padding:3mm;text-align:center}
    .kpi-value{display:block;font-size:14pt;font-weight:700;color:#102f56}
    .kpi-label{display:block;margin-top:1mm;font-size:7.5pt;color:#687386;text-transform:uppercase;letter-spacing:.04em}
    .block{margin-bottom:7mm;break-inside:avoid}
    h2{margin:0 0 2.5mm;font-size:11pt;color:#173f70;border-bottom:1px solid #e1e6ec;padding-bottom:1.5mm}
    table{width:100%;border-collapse:collapse;font-size:9pt}
    th,td{padding:1.8mm 2.5mm;border-bottom:1px solid #e9ecf1;text-align:left}
    th{color:#556070;font-weight:600;font-size:8pt;text-transform:uppercase;letter-spacing:.03em}
    td.num,th.num{text-align:right;tabular-nums:1}
    .dot{display:inline-block;width:2.5mm;height:2.5mm;border-radius:50%;margin-right:1.5mm;vertical-align:middle}
    .empty{color:#8a93a1;font-style:italic;padding:3mm 0}
    .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
    footer.template-footer{margin-top:10mm;padding-top:3mm;border-top:1px solid #cad1dc;color:#687386;font-size:7.5pt;text-align:center}
  </style></head><body>
    <header class="institutional-header">
      <strong>${escapeHtml(input.institutionName)}</strong>
      <span>Sistema Digital de Gestão de Expediente</span>
    </header>
    <h1>Relatório de Actividade de Expediente</h1>
    <p class="subtitle">Panorama consolidado de volume, distribuição, tempos de tramitação e cumprimento de prazos.</p>
    <div class="meta">
      <span>Gerado em: <strong>${escapeHtml(dateLabel)}</strong></span>
      <span>Gerado por: <strong>${escapeHtml(input.generatedByName)}${input.generatedByCargo ? ` — ${escapeHtml(input.generatedByCargo)}` : ""}</strong></span>
      <span>Filtro de estatuto: <strong>${escapeHtml(input.estadoLabel)}</strong></span>
      <span>Período: <strong>${escapeHtml(input.periodoLabel)}</strong></span>
      <span>Total de expedientes considerados: <strong>${input.totalExpedientes}</strong></span>
    </div>

    <section class="block">
      <h2>Indicadores principais</h2>
      <div class="kpis">${kpiHtml}</div>
    </section>

    <div class="grid-2">
      ${distributionTable("Expedientes por estado", input.statusDist, input.totalExpedientes)}
      ${distributionTable("Expedientes por tipo", input.typeDist, input.totalExpedientes)}
    </div>
    <div class="grid-2">
      ${distributionTable("Distribuição por sector", input.sectorDist, input.totalExpedientes)}
      <section class="block">
        <h2>Tempo médio por etapa</h2>
        <table><thead><tr><th>Etapa</th><th class="num">Dias médios</th></tr></thead><tbody>${stageRows}</tbody></table>
      </section>
    </div>

    <section class="block">
      <h2>Evolução mensal — recebidos vs. concluídos</h2>
      <table><thead><tr><th>Mês</th><th class="num">Recebidos</th><th class="num">Concluídos</th></tr></thead><tbody>${monthlyRows}</tbody></table>
    </section>

    <section class="block">
      <h2>Cumprimento de prazos por mês</h2>
      <table><thead><tr><th>Mês</th><th class="num">No prazo</th><th class="num">Atrasado</th></tr></thead><tbody>${deadlineRows}</tbody></table>
    </section>

    <footer class="template-footer">Documento gerado automaticamente pelo Sistema Digital de Gestão de Expediente da CFM — uso interno.</footer>
  </body></html>`;
}
