import { CommandBar } from "./command-bar";
import { ProfileRouteGuard } from "./profile-route-guard";
import { Sidebar } from "./sidebar";
import { StatusBar } from "./status-bar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-graphite-50">
      <ProfileRouteGuard />
      <Topbar />
      <CommandBar />
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <Sidebar />
        <main
          id="conteudo-principal"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-graphite-50"
        >
          {children}
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
