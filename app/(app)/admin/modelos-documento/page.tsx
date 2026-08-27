import { requireAdminArea } from "@/lib/auth";
import { ModelosDocumentoPageClient } from "./_client";

export const metadata = { title: "Modelos de documento" };

export default async function ModelosDocumentoPage() {
  await requireAdminArea("modelos-documento");
  return <ModelosDocumentoPageClient />;
}
