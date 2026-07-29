import type { ExpedientStatus, Priority, Confidentiality } from "@/types";

interface StatusDef {
  label: string;
  badge: string;
  dot: string;
  description: string;
  icon:
    | "FileEdit"
    | "Send"
    | "Inbox"
    | "Stamp"
    | "Forward"
    | "Search"
    | "MessageSquareText"
    | "HelpCircle"
    | "Undo2"
    | "CheckCircle2"
    | "XCircle"
    | "PackageCheck"
    | "ClipboardCheck"
    | "Archive"
    | "Ban"
    | "PauseCircle"
    | "TimerOff"
    | "AlertTriangle";
}

export const STATUS_META: Record<ExpedientStatus, StatusDef> = {
  rascunho: { label: "Rascunho", badge: "bg-graphite-100 text-graphite-700 border-graphite-200", dot: "bg-graphite-400", description: "Ainda não submetido. Visível apenas ao autor.", icon: "FileEdit" },
  submetido: { label: "Submetido", badge: "bg-info-50 text-info-700 border-info-200", dot: "bg-info-500", description: "Enviado à secretaria, aguarda recepção.", icon: "Send" },
  recebido: { label: "Recebido", badge: "bg-info-50 text-info-700 border-info-200", dot: "bg-info-500", description: "Recepcionado pela secretaria, aguarda protocolo.", icon: "Inbox" },
  protocolado: { label: "Protocolado", badge: "bg-navy-50 text-navy-700 border-navy-200", dot: "bg-navy-500", description: "Número de protocolo atribuído e registado no livro.", icon: "Stamp" },
  encaminhado: { label: "Encaminhado", badge: "bg-info-50 text-info-700 border-info-200", dot: "bg-info-500", description: "Enviado para a unidade responsável.", icon: "Forward" },
  em_analise: { label: "Em análise", badge: "bg-info-50 text-info-700 border-info-200", dot: "bg-info-500", description: "Em avaliação técnica pelo responsável actual.", icon: "Search" },
  aguardando_parecer: { label: "Aguardando parecer", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", description: "Parecer técnico solicitado a outra unidade.", icon: "MessageSquareText" },
  aguardando_esclarecimento: { label: "Aguardando esclarecimento", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", description: "Informação adicional solicitada ao remetente.", icon: "HelpCircle" },
  devolvido: { label: "Devolvido", badge: "bg-crimson-50 text-crimson-700 border-crimson-200", dot: "bg-crimson-500", description: "Devolvido para correcção antes de prosseguir.", icon: "Undo2" },
  aprovado: { label: "Aprovado", badge: "bg-success-50 text-success-700 border-success-200", dot: "bg-success-500", description: "Aprovado pelo responsável competente.", icon: "CheckCircle2" },
  rejeitado: { label: "Rejeitado", badge: "bg-crimson-50 text-crimson-700 border-crimson-200", dot: "bg-crimson-500", description: "Rejeitado. Processo não prossegue nesta forma.", icon: "XCircle" },
  disponivel_remetente: { label: "Disponível ao remetente", badge: "bg-navy-50 text-navy-700 border-navy-200", dot: "bg-navy-500", description: "Resposta pronta para levantamento pelo remetente.", icon: "PackageCheck" },
  recebimento_confirmado: { label: "Recebimento confirmado", badge: "bg-success-50 text-success-700 border-success-200", dot: "bg-success-500", description: "O remetente confirmou a recepção da resposta.", icon: "ClipboardCheck" },
  arquivado: { label: "Arquivado", badge: "bg-graphite-100 text-graphite-600 border-graphite-200", dot: "bg-graphite-400", description: "Processo concluído e arquivado.", icon: "Archive" },
  cancelado: { label: "Cancelado", badge: "bg-graphite-100 text-graphite-600 border-graphite-200", dot: "bg-graphite-400", description: "Processo cancelado antes da conclusão.", icon: "Ban" },
  suspenso: { label: "Suspenso", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", description: "Tramitação temporariamente suspensa.", icon: "PauseCircle" },
  expirado: { label: "Expirado", badge: "bg-crimson-50 text-crimson-700 border-crimson-200", dot: "bg-crimson-500", description: "Prazo de resposta ultrapassado sem acção.", icon: "TimerOff" },
  atrasado: { label: "Atrasado", badge: "bg-crimson-50 text-crimson-700 border-crimson-200", dot: "bg-crimson-500", description: "Ultrapassou o prazo previsto para esta etapa.", icon: "AlertTriangle" },
};

export const PRIORITY_META: Record<Priority, { label: string; badge: string; dot: string }> = {
  baixa: { label: "Baixa", badge: "bg-graphite-100 text-graphite-600 border-graphite-200", dot: "bg-graphite-400" },
  normal: { label: "Normal", badge: "bg-info-50 text-info-700 border-info-200", dot: "bg-info-500" },
  alta: { label: "Alta", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  urgente: { label: "Urgente", badge: "bg-crimson-50 text-crimson-700 border-crimson-200", dot: "bg-crimson-500" },
};

export const CONFIDENTIALITY_META: Record<Confidentiality, { label: string; badge: string }> = {
  publico: { label: "Público", badge: "bg-graphite-100 text-graphite-600 border-graphite-200" },
  interno: { label: "Interno", badge: "bg-info-50 text-info-700 border-info-200" },
  restrito: { label: "Restrito", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  confidencial: { label: "Confidencial", badge: "bg-crimson-50 text-crimson-700 border-crimson-200" },
};
