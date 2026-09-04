/**
 * Maps expedient action keys (lib/expedient-actions.ts) and admin areas to the
 * permission ids an administrator can toggle per profile (data/permissions.ts).
 * An action/area with no entry here is governed only by the profile type itself
 * (perfilNavegacao), exactly as before — permissions only ever narrow, never widen,
 * what a profile type could already do.
 */
export const ACTION_PERMISSIONS: Record<string, string[]> = {
  receber_encaminhar: ["secretaria.receber", "secretaria.protocolar", "secretaria.encaminhar"],
  receber: ["secretaria.receber"],
  protocolar: ["secretaria.protocolar"],
  encaminhar: ["expedientes.encaminhar", "secretaria.encaminhar"],
  parecer: ["expedientes.parecer"],
  aprovar: ["expedientes.aprovar"],
  rejeitar: ["expedientes.aprovar"],
  devolver: ["expedientes.devolver", "expedientes.aprovar", "secretaria.receber", "secretaria.protocolar"],
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

// Verificacao ad-hoc (qualquer um dos ids satisfaz) para paginas/rotas fora do
// admin e das accoes de expediente, ex.: livro, relatorios, anexos.
export function hasPermission(permissoes: string[], ids: string[]) {
  return satisfies(permissoes, ids);
}

// Verificacao ad-hoc que exige TODOS os ids (usada quando uma unica accao
// aplica dois efeitos distintos, ex.: despacho aplica carimbo E assinatura).
export function hasAllPermissions(permissoes: string[], ids: string[]) {
  if (permissoes.includes("*")) return true;
  return ids.every((id) => permissoes.includes(id));
}
