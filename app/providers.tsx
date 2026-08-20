"use client";

import { SessionProvider, SidebarProvider } from "@/lib/session";
import { ToastProvider } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import type { AuthSession } from "@/lib/session-types";

export function Providers({ children, initialSession }: { children: React.ReactNode; initialSession: AuthSession }) {
  return (
    <SessionProvider initialSession={initialSession}>
      <SidebarProvider>
        <ToastProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster />
          </TooltipProvider>
        </ToastProvider>
      </SidebarProvider>
    </SessionProvider>
  );
}
