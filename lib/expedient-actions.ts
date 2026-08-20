import type { ExpedientStatus } from "@/types";

export type ActionKind = "confirm" | "forward" | "protocolar" | "resposta" | "note" | "archive";

export interface ActionDef {
  key: string;
  label: string;
  icon: string;
  variant: "primary" | "secondary" | "destructive" | "outline";
  kind: ActionKind;
}

const A = {
  submeter: { key: "submeter", label: "Submeter", icon: "Send", variant: "primary", kind: "confirm" } as ActionDef,
  receber: { key: "receber", label: "Receber", icon: "Inbox", variant: "primary", kind: "confirm" } as ActionDef,
  protocolar: { key: "protocolar", label: "Protocolar", icon: "Stamp", variant: "primary", kind: "protocolar" } as ActionDef,
  encaminhar: { key: "encaminhar", label: "Encaminhar", icon: "Forward", variant: "primary", kind: "forward" } as ActionDef,
  parecer: { key: "parecer", label: "Solicitar parecer", icon: "MessageSquareText", variant: "secondary", kind: "forward" } as ActionDef,
  esclarecimento: { key: "esclarecimento", label: "Solicitar esclarecimento", icon: "HelpCircle", variant: "secondary", kind: "note" } as ActionDef,
  aprovar: { key: "aprovar", label: "Aprovar", icon: "CheckCircle2", variant: "primary", kind: "confirm" } as ActionDef,
  rejeitar: { key: "rejeitar", label: "Rejeitar", icon: "XCircle", variant: "destructive", kind: "note" } as ActionDef,
  devolver: { key: "devolver", label: "Devolver para correcção", icon: "Undo2", variant: "secondary", kind: "note" } as ActionDef,
  resposta: { key: "resposta", label: "Criar despacho / resposta", icon: "FileEdit", variant: "secondary", kind: "resposta" } as ActionDef,
  disponibilizar: { key: "disponibilizar", label: "Disponibilizar ao remetente", icon: "PackageCheck", variant: "primary", kind: "confirm" } as ActionDef,
  confirmar: { key: "confirmar", label: "Confirmar recebimento", icon: "ClipboardCheck", variant: "primary", kind: "confirm" } as ActionDef,
  arquivar: { key: "arquivar", label: "Arquivar", icon: "Archive", variant: "secondary", kind: "archive" } as ActionDef,
  retomar: { key: "retomar", label: "Retomar tramitação", icon: "PlayCircle", variant: "primary", kind: "confirm" } as ActionDef,
  escalar: { key: "escalar", label: "Escalar prioridade", icon: "TrendingUp", variant: "destructive", kind: "confirm" } as ActionDef,
  notificar: { key: "notificar", label: "Notificar remetente", icon: "Send", variant: "secondary", kind: "confirm" } as ActionDef,
};

export const ACTIONS_BY_STATUS: Record<ExpedientStatus, ActionDef[]> = {
  rascunho: [A.submeter],
  submetido: [A.receber],
  recebido: [A.protocolar],
  protocolado: [A.encaminhar],
  encaminhado: [A.encaminhar, A.parecer, A.devolver, A.aprovar],
  em_analise: [A.encaminhar, A.aprovar, A.rejeitar, A.devolver, A.parecer, A.esclarecimento],
  aguardando_parecer: [A.resposta, A.esclarecimento],
  aguardando_esclarecimento: [A.resposta],
  devolvido: [A.resposta, A.encaminhar],
  aprovado: [A.resposta, A.disponibilizar],
  rejeitado: [A.notificar, A.arquivar],
  disponivel_remetente: [A.confirmar],
  recebimento_confirmado: [A.arquivar],
  arquivado: [],
  cancelado: [],
  suspenso: [A.retomar],
  expirado: [A.escalar, A.arquivar],
  atrasado: [A.escalar, A.encaminhar, A.aprovar],
};
