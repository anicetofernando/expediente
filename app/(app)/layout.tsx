import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/app/providers";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
