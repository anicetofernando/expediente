import type { ExpedientStatus } from "@/types";

export type ActionKind = "confirm" | "forward" | "receive-forward" | "resposta" | "resposta-cobertura" | "nota" | "note" | "archive" | "aprovar" | "rejeitar";

export interface ActionDef {
  key: string;
  label: string;
  icon: string;
  variant: "primary" | "secondary" | "destructive" | "outline";
  kind: ActionKind;
}

const A = {
  submeter: { key: "submeter", label: "Submeter", icon: "Send", variant: "primary", kind: "confirm" } as ActionDef,
  receberEncaminhar: { key: "receber_encaminhar", label: "Receber e protocolar", icon: "Stamp", variant: "primary", kind: "receive-forward" } as ActionDef,
  encaminhar: { key: "encaminhar", label: "Encaminhar", icon: "Forward", variant: "primary", kind: "forward" } as ActionDef,
  parecer: { key: "parecer", label: "Solicitar parecer", icon: "MessageSquareText", variant: "secondary", kind: "forward" } as ActionDef,
  esclarecimento: { key: "esclarecimento", label: "Solicitar esclarecimento", icon: "HelpCircle", variant: "secondary", kind: "note" } as ActionDef,
  aprovar: { key: "aprovar", label: "Aprovar", icon: "CheckCircle2", variant: "primary", kind: "aprovar" } as ActionDef,
  aprovarNota: { key: "aprovar_nota", label: "Emitir nota de cobertura", icon: "FileEdit", variant: "secondary", kind: "confirm" } as ActionDef,
  criarNota: { key: "criar_nota", label: "Criar nota", icon: "FileEdit", variant: "primary", kind: "nota" } as ActionDef,
  rejeitar: { key: "rejeitar", label: "Rejeitar", icon: "XCircle", variant: "destructive", kind: "rejeitar" } as ActionDef,
  devolver: { key: "devolver", label: "Devolver para correcção", icon: "Undo2", variant: "secondary", kind: "note" } as ActionDef,
  resposta: { key: "resposta", label: "Criar despacho", icon: "FileEdit", variant: "secondary", kind: "resposta" } as ActionDef,
  respostaNota: { key: "responder_nota", label: "Emitir nota de cobertura", icon: "FileEdit", variant: "secondary", kind: "confirm" } as ActionDef,
  enviarParecer: { key: "enviar_parecer", label: "Assinar e enviar", icon: "Send", variant: "primary", kind: "resposta-cobertura" } as ActionDef,
  disponibilizar: { key: "disponibilizar", label: "Disponibilizar ao remetente", icon: "PackageCheck", variant: "primary", kind: "confirm" } as ActionDef,
  confirmar: { key: "confirmar", label: "Confirmar recebimento", icon: "ClipboardCheck", variant: "primary", kind: "confirm" } as ActionDef,
  arquivar: { key: "arquivar", label: "Arquivar", icon: "Archive", variant: "secondary", kind: "archive" } as ActionDef,
  retomar: { key: "retomar", label: "Retomar tramitação", icon: "PlayCircle", variant: "primary", kind: "confirm" } as ActionDef,
  escalar: { key: "escalar", label: "Escalar prioridade", icon: "TrendingUp", variant: "destructive", kind: "confirm" } as ActionDef,
  notificar: { key: "notificar", label: "Notificar remetente", icon: "Send", variant: "secondary", kind: "confirm" } as ActionDef,
};

export const ACTIONS_BY_STATUS: Record<ExpedientStatus, ActionDef[]> = {
  rascunho: [],
  submetido: [A.receberEncaminhar, A.devolver],
  recebido: [A.receberEncaminhar, A.devolver],
  protocolado: [A.receberEncaminhar, A.devolver],
  // A partir da 1a nota (assinada pela Secretaria), so' ha' Aprovar -- que abre
  // as duas formas (finalizar, ou emitir nota de cobertura para poder subir/
  // pedir parecer). Encaminhar/Solicitar parecer so' ficam disponiveis depois
  // de emitida e assinada essa nota de cobertura (estado "nota_cobertura").
  encaminhado: [A.devolver, A.aprovar, A.rejeitar],
  nota_cobertura: [A.encaminhar, A.parecer],
  em_analise: [A.encaminhar, A.aprovar, A.rejeitar, A.devolver, A.parecer],
  // Tal como o Aprovar do lado de quem pediu, quem recebe o pedido de parecer
  // tem as mesmas duas opcoes directamente em Acoes: responder ja' com um
  // despacho, ou pedir a' Secretaria uma nota de cobertura para devolver
  // carimbada/assinada (estado "resposta_parecer").
  aguardando_parecer: [A.resposta, A.respostaNota],
  aguardando_esclarecimento: [A.resposta],
  resposta_parecer: [A.enviarParecer],
  em_transito: [A.receberEncaminhar],
  nota_pendente: [A.criarNota],
  devolvido: [],
  aprovado: [A.disponibilizar],
  rejeitado: [A.notificar],
  disponivel_remetente: [A.confirmar],
  recebimento_confirmado: [A.arquivar],
  arquivado: [],
  cancelado: [],
  suspenso: [A.retomar],
  expirado: [A.escalar, A.arquivar],
  atrasado: [A.escalar, A.encaminhar, A.aprovar],
};
