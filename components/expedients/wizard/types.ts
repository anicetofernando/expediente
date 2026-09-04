import type { Confidentiality, FreePosition, Priority } from "@/types";

export type DocumentOrigin = "sistema" | "importado" | "apenas-processo";

export interface WizardAttachment {
  id: string;
  nome: string;
  tamanho: string;
  descricao: string;
  confidencialidade: Confidentiality | "";
  ficheiro?: File;
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
  ficheiro?: File;
  anexos: WizardAttachment[];
  usarCarimboAssinatura: boolean;
  posicaoCarimbo?: FreePosition;
  posicaoAssinatura?: FreePosition;
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
  usarCarimboAssinatura: true,
};

export interface StepProps {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}
