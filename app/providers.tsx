"use client";

import { SessionProvider } from "@/lib/session";
import { CatalogsProvider } from "@/lib/catalogs";
import { ToastProvider } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CatalogsProvider>
        <ToastProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster />
          </TooltipProvider>
        </ToastProvider>
      </CatalogsProvider>
    </SessionProvider>
  );
}
