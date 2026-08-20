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
}

interface SidebarContextValue {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);
const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function SessionProvider({ children, initialSession }: { children: React.ReactNode; initialSession: AuthSession }) {
  const value = React.useMemo<SessionContextValue>(
    () => ({ ...initialSession, nivel: initialSession.profile.nivel, sessionReady: true }),
    [initialSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const toggleSidebar = React.useCallback(() => setSidebarCollapsed((value) => !value), []);
  const value = React.useMemo(
    () => ({ sidebarCollapsed, toggleSidebar }),
    [sidebarCollapsed, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSession() {
  const context = React.useContext(SessionContext);
  if (!context) throw new Error("useSession deve ser utilizado dentro de SessionProvider");
  return context;
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar deve ser utilizado dentro de SidebarProvider");
  return context;
}
