import { allExpedients } from "@/data/expedients";
import { currentUser } from "@/data/organization";
import { unitById } from "@/data/organization";
import type { Expedient } from "@/types";

const CONCLUDED = ["arquivado", "aprovado", "recebimento_confirmado"];
const PENDING = ["submetido", "recebido", "protocolado", "encaminhado", "em_analise", "aguardando_parecer", "aguardando_esclarecimento", "atrasado"];
const unitName = unitById(currentUser.unidadeId)?.nome ?? "";

export function meusExpedientes(): Expedient[] {
  return allExpedients.filter((e) => e.remetente.nome === currentUser.nome || e.responsavelActualId === currentUser.id);
}

export function caixaEntrada(): Expedient[] {
  return allExpedients.filter((e) => e.responsavelActualId === currentUser.id && !CONCLUDED.includes(e.estado) && e.estado !== "cancelado");
}

export function caixaSaida(): Expedient[] {
  return allExpedients.filter((e) => e.unidadeOrigem === unitName);
}

export function pendentes(): Expedient[] {
  return allExpedients.filter((e) => PENDING.includes(e.estado));
}

export function emAnalise(): Expedient[] {
  return allExpedients.filter((e) => e.estado === "em_analise");
}

export function devolvidos(): Expedient[] {
  return allExpedients.filter((e) => e.estado === "devolvido" || e.estado === "rejeitado");
}

export function concluidos(): Expedient[] {
  return allExpedients.filter((e) => CONCLUDED.includes(e.estado));
}
