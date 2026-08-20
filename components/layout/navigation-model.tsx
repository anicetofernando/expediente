import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  Bell,
  BookMarked,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FilePlus2,
  FileText,
  FileType2,
  Files,
  FolderKanban,
  Forward,
  History,
  IdCard,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  ListChecks,
  ListOrdered,
  MessageSquareText,
  Network,
  PackageCheck,
  Paperclip,
  PenTool,
  ScanLine,
  Search,
  SendHorizontal,
  Settings2,
  ShieldCheck,
  Stamp,
  Timer,
  TrendingUp,
  Undo2,
  Users,
  Users2,
  Workflow,
} from "lucide-react";
import {
  navigation,
  perfisNavegacao,
  type NavGroupConfig,
  type PerfilNavegacao,
} from "@/config/navigation";

export type NavigationGroup = NavGroupConfig;

const NAVIGATION_ICONS: Record<string, LucideIcon> = {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  Bell,
  BookMarked,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FilePlus2,
  FileText,
  FileType2,
  Files,
  FolderKanban,
  Forward,
  History,
  IdCard,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  ListChecks,
  ListOrdered,
  MessageSquareText,
  Network,
  PackageCheck,
  Paperclip,
  PenTool,
  ScanLine,
  Search,
  SendHorizontal,
  Settings2,
  ShieldCheck,
  Stamp,
  Timer,
  TrendingUp,
  Undo2,
  Users,
  Users2,
  Workflow,
};

const GROUP_ICONS: Record<string, LucideIcon> = {
  Expedientes: FolderKanban,
  Expediente: FolderKanban,
  Secretaria: Inbox,
  Aprovações: ClipboardCheck,
  Documentos: FileText,
  Relatórios: BarChart3,
  Administração: Settings2,
};

const GROUP_LABELS: Record<string, string> = {
  Expediente: "Expedientes",
};

const GROUP_LANDING_ROUTES: Record<string, string> = {
  Expedientes: "/painel",
  Expediente: "/expedientes/meus",
  Secretaria: "/secretaria",
  Aprovações: "/aprovacoes",
  Documentos: "/documentos",
  Relatórios: "/relatorios",
  Administração: "/admin/utilizadores",
};

export function getVisibleNavigation(perfil: PerfilNavegacao): NavigationGroup[] {
  return navigation
    .filter((group) => group.perfis.includes(perfil))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.perfis || item.perfis.includes(perfil)),
    }))
    .filter((group) => group.items.length > 0);
}

export function getProfileLandingHref(perfil: PerfilNavegacao) {
  return perfisNavegacao.find((item) => item.id === perfil)?.landingHref ?? "/painel";
}

const COMMON_ROUTE_PREFIXES = ["/perfil", "/notificacoes"];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isExpedientConsultationPath(pathname: string) {
  if (pathname === "/expedientes") return true;

  const identifier = pathname.match(/^\/expedientes\/([^/]+)$/)?.[1];
  if (!identifier) return false;

  // Os registos persistidos usam UUID. Mantemos tambem o formato legado
  // `exp-*` para que expedientes antigos continuem acessiveis.
  return (
    /^exp-[^/]+$/i.test(identifier) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier)
  );
}

export function isPathAllowedForProfile(pathname: string, perfil: PerfilNavegacao) {
  if (COMMON_ROUTE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return true;
  }

  switch (perfil) {
    case "remetente":
      return ["/painel", "/expedientes", "/documentos"].some((prefix) =>
        matchesPrefix(pathname, prefix)
      );
    case "secretaria":
      return (
        ["/secretaria", "/livro", "/documentos/arquivo"].some(
          (prefix) => matchesPrefix(pathname, prefix)
        ) || isExpedientConsultationPath(pathname)
      );
    case "superior":
      return (
        ["/aprovacoes", "/relatorios"].some((prefix) =>
          matchesPrefix(pathname, prefix)
        ) || isExpedientConsultationPath(pathname)
      );
    case "administracao":
      return matchesPrefix(pathname, "/admin");
  }
}

export function getNavigationIcon(name: string) {
  return NAVIGATION_ICONS[name] ?? FileText;
}

export function getGroupIcon(group: NavigationGroup) {
  return GROUP_ICONS[group.label] ?? getNavigationIcon(group.items[0]?.icon);
}

export function getGroupLabel(group: NavigationGroup) {
  return GROUP_LABELS[group.label] ?? group.label;
}

export function getGroupLandingHref(group: NavigationGroup) {
  const preferredHref = GROUP_LANDING_ROUTES[group.label];
  return group.items.some((item) => item.href === preferredHref)
    ? preferredHref
    : group.items[0]?.href ?? "/painel";
}

export function getActiveHref(pathname: string, groups: NavigationGroup[]) {
  return groups
    .flatMap((group) => group.items)
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

export function getActiveGroup(pathname: string, groups: NavigationGroup[], activeHref?: string) {
  const directGroup = groups.find((group) => group.items.some((item) => item.href === activeHref));
  if (directGroup) return directGroup;

  const section = pathname.split("/").filter(Boolean)[0];
  if (!section) return undefined;
  return groups.find((group) =>
    group.items.some((item) => item.href.split("/").filter(Boolean)[0] === section)
  );
}
