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

interface SecretaryAssignment { id: string; unit_id: string }
interface UnitId { id: string }

async function loadSecretaryAssignments(client: QueryLike): Promise<SecretaryAssignment[]> {
  // So' o perfil PRINCIPAL de cada utilizador conta -- e' o unico que define o
  // seu perfilNavegacao efectivo (tal como a sessao o calcula em lib/auth.ts).
  // Um perfil secundario "secretaria" nao deve, por si so, fazer alguem
  // aparecer como secretaria de uma unidade.
  const result = await client.query(
    `SELECT u.id,u.unit_id FROM users u JOIN user_profiles up ON up.user_id=u.id AND up.is_primary=true JOIN profiles p ON p.id=up.profile_id
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
  const activeUnit = await client.query("SELECT 1 FROM organizational_units WHERE id=$1 AND active=true", [unitId]);
  if (activeUnit.rows.length === 0) return null;
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

// A quem um expediente encaminhado/protocolado para esta unidade fica
// atribuido: o "superior" dessa unidade (chefe/aprovador); na ausencia de um,
// qualquer utilizador activo da unidade que nao seja da secretaria.
export async function targetResponsible(client: QueryLike, unitId: string) {
  const activeUnit = await client.query("SELECT 1 FROM organizational_units WHERE id=$1 AND active=true", [unitId]);
  if (activeUnit.rows.length === 0) throw new Error("A unidade seleccionada nao esta activa.");
  // "Superior" nem sempre e' o slug literal do perfil -- um perfil
  // personalizado (ex.: "Chefe de Servico" criado em Admin > Perfis) tambem
  // conta, desde que o seu access_level seja "supervisao"/"direccao", exactamente
  // a mesma regra usada para determinar o perfilNavegacao na sessao (lib/auth.ts).
  // So' o perfil PRINCIPAL conta -- um utilizador com um perfil secundario
  // "superior" (ex.: uma secretaria que tambem tem um perfil de chefe
  // atribuido para outro fim) nao deve, por causa disso, comecar a receber
  // expedientes como se fosse o chefe efectivo desta unidade.
  const superior = await client.query(
    `SELECT u.id
       FROM users u
       JOIN user_profiles up ON up.user_id=u.id AND up.is_primary=true
       JOIN profiles p ON p.id=up.profile_id
      WHERE u.unit_id=$1 AND u.status='activo'
        AND (p.slug='superior' OR p.access_level IN ('supervisao','direccao'))
      ORDER BY u.full_name LIMIT 1`,
    [unitId],
  );
  const superiorRow = (superior.rows as { id: string }[])[0];
  if (superiorRow) return superiorRow.id;
  const responsible = await client.query(
    `SELECT u.id
       FROM users u
      WHERE u.unit_id=$1 AND u.status='activo'
        AND NOT EXISTS (
          SELECT 1 FROM user_profiles up JOIN profiles p ON p.id=up.profile_id
           WHERE up.user_id=u.id AND up.is_primary=true AND p.slug='secretaria'
        )
      ORDER BY u.full_name LIMIT 1`,
    [unitId],
  );
  const responsibleRow = (responsible.rows as { id: string }[])[0];
  if (!responsibleRow) throw new Error("A unidade seleccionada nao tem um responsavel activo.");
  return responsibleRow.id;
}
