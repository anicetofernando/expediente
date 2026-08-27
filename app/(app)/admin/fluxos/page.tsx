import { requireAdminArea } from "@/lib/auth";
import { FluxosPageClient } from "./_client";

export const metadata = { title: "Fluxos" };

export default async function FluxosPage() {
  await requireAdminArea("fluxos");
  return <FluxosPageClient />;
}
