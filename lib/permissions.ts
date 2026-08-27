/**
 * Maps expedient action keys (lib/expedient-actions.ts) and admin areas to the
 * permission ids an administrator can toggle per profile (data/permissions.ts).
 * An action/area with no entry here is governed only by the profile type itself
 * (perfilNavegacao), exactly as before — permissions only ever narrow, never widen,
 * what a profile type could already do.
 */
export const ACTION_PERMISSIONS: Record<string, string[]> = {
  receber: ["secretaria.receber"],
  protocolar: ["secretaria.protocolar"],
  encaminhar: ["expedientes.encaminhar", "secretaria.encaminhar"],
  parecer: ["expedientes.parecer"],
  aprovar: ["expedientes.aprovar"],
  rejeitar: ["expedientes.aprovar"],
  devolver: ["expedientes.devolver"],
  arquivar: ["expedientes.arquivar"],
};

export const ADMIN_AREA_PERMISSIONS: Record<string, string[]> = {
  utilizadores: ["admin.utilizadores"],
  perfis: ["admin.perfis"],
  permissoes: ["admin.perfis"],
  "estrutura-organizacional": ["admin.estrutura"],
  fluxos: ["admin.fluxos"],
  configuracoes: ["admin.configuracoes"],
  carimbos: ["carimbos.gerir"],
  assinaturas: ["assinaturas.gerir"],
  "modelos-documento": ["documentos.modelos.gerir"],
};

function satisfies(permissoes: string[], required: string[] | undefined) {
  if (!required || required.length === 0) return true;
  if (permissoes.includes("*")) return true;
  return required.some((id) => permissoes.includes(id));
}

export function hasActionPermission(permissoes: string[], action: string) {
  return satisfies(permissoes, ACTION_PERMISSIONS[action]);
}

export function hasAdminAreaPermission(permissoes: string[], area: string) {
  return satisfies(permissoes, ADMIN_AREA_PERMISSIONS[area]);
}
