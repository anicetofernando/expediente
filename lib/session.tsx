"use client";

import * as React from "react";
import type { NivelAcesso, PerfilNavegacao } from "@/config/navigation";
import type { AuthSession } from "@/lib/session-types";
import type { Profile, User } from "@/types";

interface SessionContextValue {
  user: User;
  profile: Profile;
  nivel: NivelAcesso;
  perfilNavegacao: PerfilNavegacao;
  sessionReady: boolean;
  unitName: string;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

export function SessionProvider({ children, initialSession }: { children: React.ReactNode; initialSession: AuthSession }) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  return (
    <SessionContext.Provider
      value={{
        ...initialSession,
        nivel: initialSession.profile.nivel,
        sessionReady: true,
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
  if (!context) throw new Error("useSession deve ser utilizado dentro de SessionProvider");
  return context;
}
