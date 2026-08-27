// Tipos de domínio do Sistema Digital de Gestão de Expediente

export type ExpedientStatus =
  | "rascunho"
  | "submetido"
  | "recebido"
  | "protocolado"
  | "encaminhado"
  | "em_analise"
  | "aguardando_parecer"
  | "aguardando_esclarecimento"
  | "devolvido"
  | "aprovado"
  | "rejeitado"
  | "disponivel_remetente"
  | "recebimento_confirmado"
  | "arquivado"
  | "cancelado"
  | "suspenso"
  | "expirado"
  | "atrasado";

export type Priority = "baixa" | "normal" | "alta" | "urgente";

export type Confidentiality = "publico" | "interno" | "restrito" | "confidencial";

export interface OrganizationalUnit {
  id: string;
  nome: string;
  sigla: string;
  codigo: string;
  tipo: "direccao" | "departamento" | "seccao" | "sector" | "unidade";
  parentId: string | null;
  responsavelId: string;
  substitutoId?: string;
  contactos: {
    email?: string;
    telefone?: string;
    ramal?: string;
  };
  estado: "activo" | "inactivo";
}

export interface User {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  unidadeId: string;
  perfilIds: string[];
  avatarColor: string;
  estado: "activo" | "inactivo" | "suspenso";
  ultimoAcesso?: string;
  telefone?: string;
  precisaAlterarPalavraPasse?: boolean;
}

export type TipoBasePerfil = "remetente" | "secretaria" | "superior" | "administracao";

export interface Profile {
  id: string;
  nome: string;
  descricao: string;
  tipoBase: TipoBasePerfil;
  nivel: "operacional" | "supervisao" | "direccao" | "administracao";
  utilizadoresCount: number;
  permissoes: string[];
  ambito: "global" | "unidade" | "sector";
  estado: "activo" | "inactivo";
}

export interface PermissionModule {
  modulo: string;
  permissoes: { id: string; label: string; descricao: string }[];
}

export interface StatusMeta {
  value: ExpedientStatus;
  label: string;
  colorClass: string;
  dotClass: string;
  description: string;
}

export interface Sender {
  nome: string;
  tipo: "interno" | "externo";
  unidade?: string;
  documento?: string;
  contacto?: string;
}

export interface ExpedientDocument {
  id: string;
  nome: string;
  tipo: "principal" | "anexo" | "parecer" | "despacho" | "resposta";
  formato: "pdf" | "docx" | "imagem";
  paginas: number;
  tamanho: string;
  criadoEm: string;
  criadoPor: string;
  confidencialidade: Confidentiality;
  carimbado: boolean;
  assinado: boolean;
  versao: number;
  origem: "sistema" | "importado" | "digitalizado";
  conteudoHtml?: string;
  mimeType?: string;
  downloadUrl?: string;
  pdfUrl?: string;
  carimboDetalhes?: {
    id?: string;
    nome: string;
    posicao?: string;
    aplicadoPor?: string;
    aplicadoEm?: string;
  };
  assinaturaSolicitada?: boolean;
  assinaturaDetalhes?: {
    id?: string;
    proprietario: string;
    cargo?: string;
    aplicadoPor?: string;
    aplicadoEm?: string;
  };
}

export interface Delegation {
  id: string;
  delegante: User;
  delegado: User;
  ambito: string;
  dataInicio: string;
  dataFim: string;
  estado: "activa" | "agendada" | "terminada";
}

export interface TimelineEvent {
  id: string;
  tipo:
    | "criacao"
    | "submissao"
    | "recepcao"
    | "protocolo"
    | "encaminhamento"
    | "parecer"
    | "aprovacao"
    | "rejeicao"
    | "devolucao"
    | "carimbo"
    | "assinatura"
    | "entrega"
    | "confirmacao"
    | "arquivo"
    | "comentario";
  titulo: string;
  descricao: string;
  utilizador: string;
  unidade: string;
  data: string;
  anexos?: string[];
}

export interface Comment {
  id: string;
  autor: string;
  cargo: string;
  data: string;
  texto: string;
  interno: boolean;
}

export interface Expedient {
  id: string;
  protocolo: string;
  assunto: string;
  tipo: string;
  descricao: string;
  estado: ExpedientStatus;
  prioridade: Priority;
  confidencialidade: Confidentiality;
  remetente: Sender;
  destinatario: string;
  unidadeOrigem: string;
  responsavelActual: string;
  responsavelActualId: string;
  dataEntrada: string;
  prazo: string;
  ultimaActualizacao: string;
  proximaEtapa: string;
  observacoes?: string;
  documentos: ExpedientDocument[];
  timeline: TimelineEvent[];
  comentarios: Comment[];
  atrasado: boolean;
  precisaEscalarDirector: boolean;
  tipoLabel: string;
  processosRelacionados?: { protocolo: string; assunto: string }[];
}

export interface FreePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Stamp {
  id: string;
  nome: string;
  categoria: "institucional" | "funcional" | "protocolo" | "recepcao" | "aprovacao" | "confidencialidade" | "urgencia" | "outro";
  unidade: string;
  utilizadoresAutorizados: string[];
  etapasPermitidas: string[];
  tiposDocumento: string[];
  posicao: "superior-esquerda" | "superior-direita" | "inferior-esquerda" | "inferior-direita" | "centro";
  tamanho: "pequeno" | "medio" | "grande";
  transparencia: number;
  validadeDias: number | null;
  activo: boolean;
  utilizacoes: number;
  ultimaUtilizacao?: string;
  cor: string;
  imagemUrl?: string;
  posicaoLivre?: FreePosition;
}

export interface Signature {
  id: string;
  utilizadorId?: string;
  email?: string;
  proprietario: string;
  cargo: string;
  unidade: string;
  validadeInicio: string;
  validadeFim: string;
  documentosPermitidos: string[];
  requerPin: boolean;
  estado: "activa" | "revogada" | "expirada";
  utilizacoes: number;
  ultimaUtilizacao?: string;
  imagemUrl?: string;
  posicaoLivre?: FreePosition;
}

export interface WorkflowStep {
  id: string;
  nome: string;
  responsavelPerfil: string;
  prazoDias: number;
  accoesPermitidas: string[];
  carimbo?: string;
  assinaturaObrigatoria: boolean;
  proximaEtapaAprovado?: string;
  proximaEtapaRejeitado?: string;
}

export interface Workflow {
  id: string;
  nome: string;
  descricao: string;
  tipoDocumento: string;
  versao: string;
  estado: "publicado" | "rascunho" | "arquivado";
  etapas: WorkflowStep[];
  actualizadoEm: string;
  actualizadoPor: string;
}

export interface DocumentTemplate {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  camposCount: number;
  utilizacoes: number;
  actualizadoEm: string;
  estado: "activo" | "inactivo";
  cabecalho?: string;
  rodape?: string;
  logotipo?: string;
  logotipoPosicao?: "cabecalho" | "rodape" | "sem-logotipo";
  conteudoInicial?: string;
}

export interface Notification {
  id: string;
  tipo: "tarefa" | "aprovacao" | "prazo" | "sistema" | "mencao";
  titulo: string;
  descricao: string;
  data: string;
  lida: boolean;
  protocolo?: string;
  urgente?: boolean;
}

export interface AuditEntry {
  id: string;
  data: string;
  utilizador: string;
  accao: string;
  entidade: string;
  entidadeId: string;
  detalhes: string;
  ip: string;
  resultado: "sucesso" | "falha" | "bloqueado";
}

export interface LivroEntry {
  numeroSequencial: number;
  protocolo: string;
  data: string;
  origem: string;
  remetente: string;
  assunto: string;
  destinatario: string;
  estado: ExpedientStatus;
  dataSaida?: string;
  recebidoPor?: string;
  observacoes?: string;
}

export interface StatCardData {
  label: string;
  value: string | number;
  delta?: { value: string; direction: "up" | "down" | "neutral"; positive?: boolean };
  icon: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  permission?: string;
  badge?: number;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  permission?: string;
}
