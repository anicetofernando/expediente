import { requireAdminArea } from "@/lib/auth";
import { AssinaturasPageClient } from "./_client";

export const metadata = { title: "Assinaturas" };

export default async function AssinaturasPage() {
  await requireAdminArea("assinaturas");
  return <AssinaturasPageClient />;
}
