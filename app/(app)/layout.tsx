import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/app/providers";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <Providers initialSession={session}>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
