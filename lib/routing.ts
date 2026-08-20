import type { PoolClient } from "pg";
import { documentTypes as rawDocumentTypes } from "@/data/workflows";

export interface DocumentTypeConfig {
  id: string;
  nome: string;
  numeracaoPrefixo: string;
  exigeCarimbo: boolean;
  exigeAssinatura: boolean;
  exigeAprovacaoDirector: boolean;
  workflowId: string;
  activo: boolean;
  ordem: number;
}

const defaultDocumentTypes: DocumentTypeConfig[] = rawDocumentTypes.map((item, index) => ({
  ...item,
  activo: true,
  ordem: index + 1,
}));

interface QueryLike {
  query: (text: string, values?: unknown[]) => Promise<{ rows: unknown[] }>;
}

export async function configuredDocumentTypes(client: QueryLike): Promise<DocumentTypeConfig[]> {
  const result = await client.query("SELECT setting_value FROM system_settings WHERE setting_key='catalogs'");
  const row = result.rows[0] as { setting_value: unknown } | undefined;
  const catalogs = row?.setting_value;
  if (catalogs && typeof catalogs === "object" && !Array.isArray(catalogs)) {
    const types = (catalogs as { documentTypes?: unknown }).documentTypes;
    if (Array.isArray(types) && types.length > 0) return types as DocumentTypeConfig[];
  }
  return defaultDocumentTypes;
}

export function requiresDirectorEscalation(recipientUnitType: string | null | undefined, documentTypeId: string, docTypes: DocumentTypeConfig[]) {
  const config = docTypes.find((item) => item.id === documentTypeId);
  return Boolean(config?.exigeAprovacaoDirector) && recipientUnitType !== "direccao";
}

interface SecretaryAssignment { id: string; unit_id: string }
interface UnitId { id: string }

async function loadSecretaryAssignments(client: QueryLike): Promise<SecretaryAssignment[]> {
  const result = await client.query(
    `SELECT u.id,u.unit_id FROM users u JOIN user_profiles up ON up.user_id=u.id JOIN profiles p ON p.id=up.profile_id
     WHERE p.slug='secretaria' AND u.status='activo' ORDER BY u.full_name`,
  );
  return result.rows as SecretaryAssignment[];
}

async function loadActiveUnits(client: QueryLike): Promise<UnitId[]> {
  const result = await client.query("SELECT id FROM organizational_units WHERE active=true");
  return result.rows as UnitId[];
}

// Cada secretaria e' registada exactamente num departamento geral e,
// opcionalmente, tambem num servico dentro desse departamento. So' recebe o
// que for endereçado exactamente a' unidade a que esta' atribuida -- nao
// herda automaticamente os serviços de um departamento que administra. Na
// ausencia de qualquer secretaria atribuida a' unidade exacta de destino,
// recorre-se ao grupo de secretarias da unidade de recurso global (hoje, a
// Secretaria Geral) -- nunca apenas a uma pessoa especifica, para que
// colegas da mesma secretaria continuem todos a poder ajudar-se.
function groupsByUnit(assignments: SecretaryAssignment[]) {
  const byUnit = new Map<string, string[]>();
  for (const assignment of assignments) {
    const group = byUnit.get(assignment.unit_id) ?? [];
    group.push(assignment.id);
    byUnit.set(assignment.unit_id, group);
  }
  return byUnit;
}

function ownersForUnit(unitId: string, byUnit: Map<string, string[]>, globalFallbackGroup: string[]) {
  return byUnit.get(unitId) ?? globalFallbackGroup;
}

export async function resolveSecretaryId(client: PoolClient, unitId: string) {
  const assignments = await loadSecretaryAssignments(client);
  const byUnit = groupsByUnit(assignments);
  const globalFallbackGroup = assignments.length > 0 ? (byUnit.get(assignments[0].unit_id) ?? []) : [];
  const owners = ownersForUnit(unitId, byUnit, globalFallbackGroup);
  return owners[0] ?? null;
}

// Unidades pelas quais esta secretaria e' responsavel (directamente ou por
// pertencer ao grupo de recurso global), para restringir o que ve' e sobre
// o que pode agir.
export async function secretaryOwnedUnitIds(client: QueryLike, secretaryUserId: string) {
  const [assignments, units] = await Promise.all([loadSecretaryAssignments(client), loadActiveUnits(client)]);
  const byUnit = groupsByUnit(assignments);
  const globalFallbackGroup = assignments.length > 0 ? (byUnit.get(assignments[0].unit_id) ?? []) : [];
  return units
    .map((unit) => unit.id)
    .filter((unitId) => ownersForUnit(unitId, byUnit, globalFallbackGroup).includes(secretaryUserId));
}
