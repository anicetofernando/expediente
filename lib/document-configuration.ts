import type { PoolClient } from "pg";
import type { DocumentTemplate, FreePosition, Signature, Stamp } from "@/types";
import { documentTemplates as defaultTemplates } from "@/data/workflows";
import { stamps as defaultStamps } from "@/data/stamps";
import { signatures as defaultSignatures } from "@/data/signatures";

async function setting(client: PoolClient, key: string) {
  const result = await client.query<{ setting_value: unknown }>(
    "SELECT setting_value FROM system_settings WHERE setting_key=$1",
    [key],
  );
  return result.rows[0]?.setting_value;
}

export async function configuredTemplates(client: PoolClient) {
  const catalogs = await setting(client, "catalogs");
  if (catalogs && typeof catalogs === "object" && !Array.isArray(catalogs)) {
    const templates = (catalogs as { documentTemplates?: unknown }).documentTemplates;
    if (Array.isArray(templates)) return templates as DocumentTemplate[];
  }
  return defaultTemplates;
}

export async function configuredStamps(client: PoolClient) {
  const catalogs = await setting(client, "catalogs");
  if (catalogs && typeof catalogs === "object" && !Array.isArray(catalogs)) {
    const stamps = (catalogs as { stamps?: unknown }).stamps;
    if (Array.isArray(stamps)) return stamps as Stamp[];
  }
  return defaultStamps;
}

export async function configuredSignatures(client: PoolClient) {
  const signatures = await setting(client, "signatures");
  return Array.isArray(signatures) ? signatures as Signature[] : defaultSignatures;
}

export async function rememberStampPosition(client: PoolClient, stampId: string, posicao: FreePosition) {
  const result = await client.query<{ setting_value: unknown }>("SELECT setting_value FROM system_settings WHERE setting_key='catalogs'", []);
  const catalogs = result.rows[0]?.setting_value;
  if (!catalogs || typeof catalogs !== "object" || Array.isArray(catalogs)) return;
  const stamps = (catalogs as { stamps?: unknown }).stamps;
  if (!Array.isArray(stamps)) return;
  const updated = stamps.map((item) => (item && typeof item === "object" && (item as Stamp).id === stampId ? { ...item, posicaoLivre: posicao } : item));
  await client.query("UPDATE system_settings SET setting_value=$1::jsonb WHERE setting_key='catalogs'", [JSON.stringify({ ...catalogs, stamps: updated })]);
}

export async function rememberSignaturePosition(client: PoolClient, signatureId: string, posicao: FreePosition) {
  const result = await client.query<{ setting_value: unknown }>("SELECT setting_value FROM system_settings WHERE setting_key='signatures'", []);
  const signatures = result.rows[0]?.setting_value;
  if (!Array.isArray(signatures)) return;
  const updated = signatures.map((item) => (item && typeof item === "object" && (item as Signature).id === signatureId ? { ...item, posicaoLivre: posicao } : item));
  await client.query("UPDATE system_settings SET setting_value=$1::jsonb WHERE setting_key='signatures'", [JSON.stringify(updated)]);
}

export async function templateSnapshot(client: PoolClient, templateId?: string) {
  if (!templateId) return null;
  const template = (await configuredTemplates(client)).find((item) => item.id === templateId && item.estado === "activo");
  if (!template) return null;
  return {
    id: template.id,
    nome: template.nome,
    cabecalho: template.cabecalho ?? "CFM — Portos e Caminhos de Ferro de Moçambique",
    rodape: template.rodape ?? "Correspondência institucional",
    logotipo: template.logotipo?.startsWith("data:image/") ? template.logotipo : undefined,
    logotipoPosicao: template.logotipoPosicao ?? "sem-logotipo",
  } satisfies Partial<DocumentTemplate>;
}
