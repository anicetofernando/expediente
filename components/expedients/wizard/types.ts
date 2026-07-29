import type { Priority, Confidentiality } from "@/types";

export type DocumentOrigin = "sistema" | "importado" | "digitalizado" | "apenas-processo";
export type StampChoice = "nao" | "automatico" | "escolher";

export interface WizardAttachment {
  id: string;
  nome: string;
  tamanho: string;
  descricao: string;
  confidencialidade: Confidentiality | "";
}

export interface WizardState {
  tipo: string;
  unidadeOrigem: string;
  remetente: string;
  destinatario: string;
  assunto: string;
  prioridade: Priority | "";
  confidencialidade: Confidentiality | "";
  prazo: string;
  origemDocumento: DocumentOrigin | "";
  modeloId: string;
  conteudo: string;
  ficheiroNome: string;
  numPaginas: number;
  anexos: WizardAttachment[];
  carimbo: StampChoice | "";
  carimboId: string;
  solicitarAssinatura: boolean;
  posicaoPredefinida: boolean;
}

export const initialWizardState: WizardState = {
  tipo: "",
  unidadeOrigem: "",
  remetente: "",
  destinatario: "",
  assunto: "",
  prioridade: "",
  confidencialidade: "",
  prazo: "",
  origemDocumento: "",
  modeloId: "",
  conteudo: "",
  ficheiroNome: "",
  numPaginas: 0,
  anexos: [],
  carimbo: "",
  carimboId: "",
  solicitarAssinatura: false,
  posicaoPredefinida: true,
};

export interface StepProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}
