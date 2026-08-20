import { unitById, userById, users } from "@/data/organization";
import type { Expedient, ExpedientStatus } from "@/types";

const CONCLUDED: ExpedientStatus[] = ["arquivado", "aprovado", "recebimento_confirmado"];
const PENDING: ExpedientStatus[] = ["submetido", "recebido", "protocolado", "encaminhado", "em_analise", "aguardando_parecer", "aguardando_esclarecimento"];

export function coreStats(data: Expedient[]) {
  const recebidos = data.length;
  const pendentes = data.filter((e) => PENDING.includes(e.estado)).length;
  const aguardandoAprovacao = data.filter((e) => e.estado === "encaminhado" || e.estado === "em_analise" || e.estado === "aguardando_parecer" || e.estado === "atrasado").length;
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

export function statusDistribution(data: Expedient[]) {
  const counts = new Map<string, number>();
  data.forEach((e) => {
    const group = STATUS_GROUP[e.estado];
    counts.set(group, (counts.get(group) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([name, value]) => ({ name, value, color: GROUP_COLOR[name] }));
}

export function typeDistribution(data: Expedient[]) {
  const counts = new Map<string, number>();
  data.forEach((e) => counts.set(e.tipo, (counts.get(e.tipo) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);
}

export function sectorDistribution(data: Expedient[]) {
  const counts = new Map<string, number>();
  data.forEach((e) => counts.set(e.unidadeOrigem, (counts.get(e.unidadeOrigem) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export function monthlyTrend(data: Expedient[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const sameMonth = (value: string) => { const item = new Date(value); return item.getFullYear() === date.getFullYear() && item.getMonth() === date.getMonth(); };
    return {
      name: new Intl.DateTimeFormat("pt-PT", { month: "short" }).format(date).replace(".", ""),
      recebidos: data.filter((item) => sameMonth(item.dataEntrada)).length,
      concluidos: data.filter((item) => CONCLUDED.includes(item.estado) && sameMonth(item.ultimaActualizacao)).length,
    };
  });
}

export function stageAvgTime(data: Expedient[]) {
  const labels: Record<string,string> = { recepcao:"Recepção",protocolo:"Protocolo",encaminhamento:"Encaminhamento",aprovacao:"Aprovação",assinatura:"Assinatura",entrega:"Entrega",confirmacao:"Confirmação" };
  const durations = new Map<string, number[]>();
  for (const expedient of data) {
    const events = [...expedient.timeline].sort((a,b) => new Date(a.data).getTime()-new Date(b.data).getTime());
    events.forEach((event,index) => {
      const label = labels[event.tipo];
      const next = events[index+1];
      if (!label || !next) return;
      const days = Math.max(0, (new Date(next.data).getTime()-new Date(event.data).getTime())/86400000);
      durations.set(label, [...(durations.get(label)??[]), days]);
    });
  }
  return Object.values(labels).map((name) => {
    const values=durations.get(name)??[];
    return { name, dias: Number((values.reduce((sum,value)=>sum+value,0)/(values.length||1)).toFixed(2)) };
  });
}

export function deadlineCompliance(data: Expedient[]) {
  return monthlyTrend(data).map((month) => {
    const terminal = data.filter((item) => CONCLUDED.includes(item.estado) && new Intl.DateTimeFormat("pt-PT", { month:"short" }).format(new Date(item.ultimaActualizacao)).replace(".", "") === month.name);
    const late = terminal.filter((item) => new Date(item.ultimaActualizacao) > new Date(item.prazo)).length;
    const total = terminal.length;
    return { name: month.name, noPrazo: total ? Math.round(((total-late)/total)*100) : 0, atrasado: total ? Math.round((late/total)*100) : 0 };
  });
}

// Tempo médio de resposta por unidade de origem, considerando apenas processos concluídos
// (arquivado, aprovado ou com recepção confirmada). Ordenado da unidade mais lenta para a mais rápida.
export function avgResponseTimeByUnit(data: Expedient[]) {
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
export function productivityByUser(data: Expedient[]) {
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

      const user = userById(userId) ?? users.find((item) => item.nome === items[0].responsavelActual);
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
