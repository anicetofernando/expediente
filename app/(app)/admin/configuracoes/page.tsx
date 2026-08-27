import { requireAdminArea } from "@/lib/auth";
import { ConfiguracoesPageClient } from "./_client";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  await requireAdminArea("configuracoes");
  return <ConfiguracoesPageClient />;
}
