import { allExpedients } from "@/data/expedients";
import { unitById, userById } from "@/data/organization";
import type { Expedient, ExpedientStatus } from "@/types";

const CONCLUDED: ExpedientStatus[] = ["arquivado", "aprovado", "recebimento_confirmado"];
const PENDING: ExpedientStatus[] = ["submetido", "recebido", "protocolado", "encaminhado", "em_analise", "aguardando_parecer", "aguardando_esclarecimento"];

export function coreStats(data: Expedient[] = allExpedients) {
  const recebidos = data.length;
  const pendentes = data.filter((e) => PENDING.includes(e.estado)).length;
  const aguardandoAprovacao = data.filter((e) => e.estado === "em_analise" || e.estado === "aguardando_parecer").length;
  const devolvidos = data.filter((e) => e.estado === "devolvido").length;
  const atrasados = data.filter((e) => e.atrasado || e.estado === "atrasado").length;
  const concluidos = data.filter((e) => CONCLUDED.includes(e.estado)).length;

  const withDuration = data.filter((e) => CONCLUDED.includes(e.estado));
  const avgDays =
    withDuration.reduce((sum, e) => {
      const diff = (new Date(e.ultimaActualizacao).getTime() - new Date(e.dataEntrada).getTime()) / 86400000;
      return sum + Math.max(diff, 0.5);
    }, 0) / (withDuration.length || 1);

  return {
    recebidos,
    pendentes,
    aguardandoAprovacao,
    devolvidos,
    atrasados,
    concluidos,
    tempoMedioDias: avgDays.toFixed(1),
  };
}

const STATUS_GROUP: Record<ExpedientStatus, string> = {
  rascunho: "Em preparação",
  submetido: "Em curso",
  recebido: "Em curso",
  protocolado: "Em curso",
  encaminhado: "Em curso",
  em_analise: "Em curso",
  aguardando_parecer: "Aguardando",
  aguardando_esclarecimento: "Aguardando",
  devolvido: "Devolvido",
  aprovado: "Concluído",
  rejeitado: "Devolvido",
  disponivel_remetente: "Concluído",
  recebimento_confirmado: "Concluído",
  arquivado: "Concluído",
  cancelado: "Devolvido",
  suspenso: "Aguardando",
  expirado: "Atrasado",
  atrasado: "Atrasado",
};

const GROUP_COLOR: Record<string, string> = {
  "Em preparação": "#98a1ac",
  "Em curso": "#3164ae",
  Aguardando: "#bb7a18",
  Devolvido: "#a52a37",
  Concluído: "#31834f",
  Atrasado: "#8a1f2b",
};

export function statusDistribution(data: Expedient[] = allExpedients) {
  const counts = new Map<string, number>();
  data.forEach((e) => {
    const group = STATUS_GROUP[e.estado];
    counts.set(group, (counts.get(group) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([name, value]) => ({ name, value, color: GROUP_COLOR[name] }));
}

export function typeDistribution(data: Expedient[] = allExpedients) {
  const counts = new Map<string, number>();
  data.forEach((e) => counts.set(e.tipo, (counts.get(e.tipo) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);
}

export function sectorDistribution(data: Expedient[] = allExpedients) {
  const counts = new Map<string, number>();
  data.forEach((e) => counts.set(e.unidadeOrigem, (counts.get(e.unidadeOrigem) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

const MESES = ["Fev", "Mar", "Abr", "Mai", "Jun", "Jul"];
export function monthlyTrend() {
  // Série de demonstração com tendência realista de crescimento sazonal.
  return [
    { name: "Fev", recebidos: 58, concluidos: 49 },
    { name: "Mar", recebidos: 64, concluidos: 55 },
    { name: "Abr", recebidos: 71, concluidos: 60 },
    { name: "Mai", recebidos: 69, concluidos: 64 },
    { name: "Jun", recebidos: 78, concluidos: 68 },
    { name: "Jul", recebidos: 56, concluidos: 41 },
  ];
}

export function stageAvgTime() {
  return [
    { name: "Recepção", dias: 0.6 },
    { name: "Protocolo", dias: 0.4 },
    { name: "Análise", dias: 3.2 },
    { name: "Parecer", dias: 4.8 },
    { name: "Aprovação", dias: 2.1 },
    { name: "Entrega", dias: 1.1 },
  ];
}

export function deadlineCompliance() {
  return [
    { name: "Fev", noPrazo: 88, atrasado: 12 },
    { name: "Mar", noPrazo: 85, atrasado: 15 },
    { name: "Abr", noPrazo: 90, atrasado: 10 },
    { name: "Mai", noPrazo: 82, atrasado: 18 },
    { name: "Jun", noPrazo: 87, atrasado: 13 },
    { name: "Jul", noPrazo: 79, atrasado: 21 },
  ];
}

// Tempo médio de resposta por unidade de origem, considerando apenas processos concluídos
// (arquivado, aprovado ou com recepção confirmada). Ordenado da unidade mais lenta para a mais rápida.
export function avgResponseTimeByUnit(data: Expedient[] = allExpedients) {
  const byUnit = new Map<string, Expedient[]>();
  data
    .filter((e) => CONCLUDED.includes(e.estado))
    .forEach((e) => {
      const list = byUnit.get(e.unidadeOrigem) ?? [];
      list.push(e);
      byUnit.set(e.unidadeOrigem, list);
    });

  return Array.from(byUnit.entries())
    .map(([unidade, items]) => {
      const avgDays =
        items.reduce((sum, e) => {
          const diff = (new Date(e.ultimaActualizacao).getTime() - new Date(e.dataEntrada).getTime()) / 86400000;
          return sum + Math.max(diff, 0.5);
        }, 0) / (items.length || 1);
      return { unidade, mediaDias: Number(avgDays.toFixed(1)), amostras: items.length };
    })
    .sort((a, b) => b.mediaDias - a.mediaDias);
}

// Produtividade por utilizador responsável actual: processos concluídos, em curso e tempo médio de
// resolução. Cruza com data/organization.ts para obter cargo, unidade e cor de avatar.
export function productivityByUser(data: Expedient[] = allExpedients) {
  const byUser = new Map<string, Expedient[]>();
  data.forEach((e) => {
    if (!e.responsavelActualId) return;
    const list = byUser.get(e.responsavelActualId) ?? [];
    list.push(e);
    byUser.set(e.responsavelActualId, list);
  });

  return Array.from(byUser.entries())
    .map(([userId, items]) => {
      const concluded = items.filter((e) => CONCLUDED.includes(e.estado));
      const avgDays =
        concluded.reduce((sum, e) => {
          const diff = (new Date(e.ultimaActualizacao).getTime() - new Date(e.dataEntrada).getTime()) / 86400000;
          return sum + Math.max(diff, 0.5);
        }, 0) / (concluded.length || 1);

      const user = userById(userId);
      const unidade = user ? unitById(user.unidadeId)?.nome ?? "—" : "—";

      return {
        userId,
        nome: user?.nome ?? items[0].responsavelActual,
        cargo: user?.cargo ?? "—",
        unidade,
        avatarColor: user?.avatarColor ?? "navy",
        total: items.length,
        concluidos: concluded.length,
        emCurso: items.length - concluded.length,
        tempoMedioDias: Number(avgDays.toFixed(1)),
      };
    })
    .sort((a, b) => b.concluidos - a.concluidos);
}
