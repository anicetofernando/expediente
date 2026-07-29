import type { NavGroup, NavItem, Profile } from "@/types";

/**
 * O nível continua a representar a hierarquia institucional. A navegação,
 * porém, é definida pelo espaço de trabalho do utilizador e não por herança
 * automática de todos os níveis inferiores.
 */
export type NivelAcesso = Profile["nivel"];
export type PerfilNavegacao = "remetente" | "secretaria" | "superior" | "administracao";

export interface PerfilNavegacaoConfig {
  id: PerfilNavegacao;
  label: string;
  nivel: NivelAcesso;
  landingHref: string;
}

export interface NavItemConfig extends NavItem {
  perfis?: PerfilNavegacao[];
}

export interface NavGroupConfig extends Omit<NavGroup, "items"> {
  perfis: PerfilNavegacao[];
  items: NavItemConfig[];
}

export const perfisNavegacao: PerfilNavegacaoConfig[] = [
  {
    id: "remetente",
    label: "Remetente",
    nivel: "operacional",
    landingHref: "/painel",
  },
  {
    id: "secretaria",
    label: "Secretaria",
    nivel: "operacional",
    landingHref: "/secretaria",
  },
  {
    id: "superior",
    label: "Superior / Aprovador",
    nivel: "supervisao",
    landingHref: "/aprovacoes",
  },
  {
    id: "administracao",
    label: "Administração",
    nivel: "administracao",
    landingHref: "/admin/utilizadores",
  },
];

export const navigation: NavGroupConfig[] = [
  {
    label: "Expedientes",
    perfis: ["remetente"],
    items: [
      { label: "Painel", href: "/painel", icon: "LayoutDashboard" },
      {
        label: "Novo expediente",
        href: "/expedientes/novo",
        icon: "FilePlus2",
      },
      {
        label: "Meus expedientes",
        href: "/expedientes/meus",
        icon: "FolderKanban",
      },
      {
        label: "Caixa de entrada",
        href: "/expedientes/caixa-entrada",
        icon: "Inbox",
      },
      {
        label: "Caixa de saída",
        href: "/expedientes/caixa-saida",
        icon: "SendHorizontal",
      },
      {
        label: "Pendentes",
        href: "/expedientes/pendentes",
        icon: "Clock3",
      },
      {
        label: "Em análise",
        href: "/expedientes/em-analise",
        icon: "Search",
      },
      {
        label: "Devolvidos",
        href: "/expedientes/devolvidos",
        icon: "Undo2",
      },
      {
        label: "Concluídos",
        href: "/expedientes/concluidos",
        icon: "CheckCircle2",
      },
    ],
  },
  {
    label: "Secretaria",
    perfis: ["secretaria"],
    items: [
      { label: "Recepção", href: "/secretaria", icon: "Inbox" },
      { label: "Protocolos", href: "/secretaria/protocolos", icon: "Stamp" },
      { label: "Encaminhamentos", href: "/secretaria/encaminhamentos", icon: "Forward" },
      { label: "Livro de expediente", href: "/livro", icon: "BookMarked" },
      {
        label: "Entregas pendentes",
        href: "/secretaria/entregas-pendentes",
        icon: "PackageCheck",
      },
      { label: "Consultar expedientes", href: "/expedientes", icon: "Files" },
      {
        label: "Digitalizações",
        href: "/documentos/digitalizacoes",
        icon: "ScanLine",
      },
      { label: "Arquivo", href: "/documentos/arquivo", icon: "Archive" },
    ],
  },
  {
    label: "Aprovações",
    perfis: ["superior"],
    items: [
      { label: "Pendentes de decisão", href: "/aprovacoes", icon: "ClipboardCheck" },
      {
        label: "Aguardando parecer",
        href: "/aprovacoes/aguardando-parecer",
        icon: "MessageSquareText",
      },
      { label: "Delegados", href: "/aprovacoes/delegados", icon: "Users2" },
      {
        label: "Histórico de decisões",
        href: "/aprovacoes/historico",
        icon: "History",
      },
      { label: "Consultar expedientes", href: "/expedientes", icon: "Files" },
      { label: "Relatórios", href: "/relatorios", icon: "BarChart3" },
    ],
  },
  {
    label: "Administração",
    perfis: ["administracao"],
    items: [
      { label: "Utilizadores", href: "/admin/utilizadores", icon: "Users" },
      { label: "Perfis", href: "/admin/perfis", icon: "IdCard" },
      { label: "Permissões", href: "/admin/permissoes", icon: "KeyRound" },
      {
        label: "Estrutura organizacional",
        href: "/admin/estrutura-organizacional",
        icon: "Network",
      },
      { label: "Carimbos", href: "/admin/carimbos", icon: "Stamp" },
      { label: "Assinaturas", href: "/admin/assinaturas", icon: "PenTool" },
      {
        label: "Modelos de documento",
        href: "/admin/modelos-documento",
        icon: "LayoutTemplate",
      },
      {
        label: "Tipos de documento",
        href: "/admin/tipos-documento",
        icon: "FileType2",
      },
      { label: "Fluxos", href: "/admin/fluxos", icon: "Workflow" },
      { label: "Numeração", href: "/admin/numeracao", icon: "ListOrdered" },
      { label: "Notificações", href: "/admin/notificacoes", icon: "Bell" },
      { label: "Configurações", href: "/admin/configuracoes", icon: "Settings2" },
    ],
  },
];
