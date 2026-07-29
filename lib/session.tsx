"use client";

import * as React from "react";
import type { Profile, User } from "@/types";
import {
  perfisNavegacao,
  type NivelAcesso,
  type PerfilNavegacao,
} from "@/config/navigation";

const SESSION_PROFILE_KEY = "cfm-sge-demo-profile";
const DEFAULT_PROFILE: PerfilNavegacao = "remetente";

const DEMO_USERS: Record<PerfilNavegacao, User> = {
  remetente: {
    id: "usr-felismina-cossa",
    nome: "Felismina Cossa",
    email: "felismina.cossa@cfm.co.mz",
    cargo: "Técnica de expediente",
    unidadeId: "u-doc",
    perfilIds: ["p-remetente"],
    avatarColor: "info",
    estado: "activo",
  },
  secretaria: {
    id: "usr-cremilda-mabote",
    nome: "Cremilda Mabote",
    email: "cremilda.mabote@cfm.co.mz",
    cargo: "Técnica da Secretaria Geral",
    unidadeId: "u-secretaria",
    perfilIds: ["p-secretaria"],
    avatarColor: "success",
    estado: "activo",
  },
  superior: {
    id: "usr-fatima-momade",
    nome: "Fátima Momade",
    email: "fatima.momade@cfm.co.mz",
    cargo: "Chefe do Departamento de Obras e Construção",
    unidadeId: "u-doc",
    perfilIds: ["p-superior"],
    avatarColor: "navy",
    estado: "activo",
  },
  administracao: {
    id: "usr-sandro-massango",
    nome: "Sandro Massango",
    email: "sandro.massango@cfm.co.mz",
    cargo: "Administrador do sistema",
    unidadeId: "u-dg",
    perfilIds: ["p-administracao"],
    avatarColor: "graphite",
    estado: "activo",
  },
};

const DEMO_PROFILES: Record<PerfilNavegacao, Profile> = {
  remetente: {
    id: "p-remetente",
    nome: "Remetente",
    descricao: "Submissão e acompanhamento dos próprios expedientes.",
    nivel: "operacional",
    utilizadoresCount: 42,
    permissoes: ["expedientes.criar", "expedientes.ver.proprios"],
    ambito: "sector",
    estado: "activo",
  },
  secretaria: {
    id: "p-secretaria",
    nome: "Secretaria",
    descricao: "Recepção, protocolo e encaminhamento institucional.",
    nivel: "operacional",
    utilizadoresCount: 8,
    permissoes: ["secretaria", "expedientes.ver.unidade", "expedientes.encaminhar"],
    ambito: "global",
    estado: "activo",
  },
  superior: {
    id: "p-superior",
    nome: "Superior / Aprovador",
    descricao: "Decisão, parecer e consulta de expedientes.",
    nivel: "supervisao",
    utilizadoresCount: 16,
    permissoes: ["expedientes.ver.unidade", "expedientes.parecer", "expedientes.aprovar"],
    ambito: "unidade",
    estado: "activo",
  },
  administracao: {
    id: "p-administracao",
    nome: "Administração",
    descricao: "Configuração e gestão do sistema.",
    nivel: "administracao",
    utilizadoresCount: 3,
    permissoes: ["*"],
    ambito: "global",
    estado: "activo",
  },
};

const DEMO_UNITS: Record<PerfilNavegacao, string> = {
  remetente: "Departamento de Obras e Construção",
  secretaria: "Secretaria Geral",
  superior: "Departamento de Obras e Construção",
  administracao: "Direcção-Geral",
};
const VALID_PROFILES = new Set<PerfilNavegacao>(
  perfisNavegacao.map((profile) => profile.id)
);

interface SessionContextValue {
  user: User;
  profile: Profile;
  nivel: NivelAcesso;
  perfilNavegacao: PerfilNavegacao;
  setPerfilNavegacao: (perfil: PerfilNavegacao) => void;
  sessionReady: boolean;
  unitName: string;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [perfilNavegacao, setPerfilState] =
    React.useState<PerfilNavegacao>(DEFAULT_PROFILE);
  const [sessionReady, setSessionReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const savedProfile = window.localStorage.getItem(SESSION_PROFILE_KEY);
      if (savedProfile && VALID_PROFILES.has(savedProfile as PerfilNavegacao)) {
        setPerfilState(savedProfile as PerfilNavegacao);
      }
    } catch {
      // Utiliza o perfil inicial quando o armazenamento não está disponível.
    } finally {
      setSessionReady(true);
    }
  }, []);

  const setPerfilNavegacao = React.useCallback((perfil: PerfilNavegacao) => {
    setPerfilState(perfil);
    try {
      window.localStorage.setItem(SESSION_PROFILE_KEY, perfil);
    } catch {
      // A sessão continua funcional quando o armazenamento do browser está indisponível.
    }
  }, []);

  const profile = DEMO_PROFILES[perfilNavegacao];
  const user = DEMO_USERS[perfilNavegacao];
  const unitName = DEMO_UNITS[perfilNavegacao];

  return (
    <SessionContext.Provider
      value={{
        user,
        profile,
        nivel: profile.nivel,
        perfilNavegacao,
        setPerfilNavegacao,
        sessionReady,
        unitName,
        sidebarCollapsed,
        toggleSidebar: () => setSidebarCollapsed((value) => !value),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = React.useContext(SessionContext);
  if (!context) {
    throw new Error("useSession deve ser utilizado dentro de SessionProvider");
  }
  return context;
}
