import type { Signature, Stamp, User } from "@/types";

export type StampPurpose = "remetente" | "secretaria" | "aprovacao" | "despacho" | "geral";

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

export function stampBelongsToUnit(stamp: Stamp, unitName: string) {
  return stamp.unidade === "Global" || normalized(stamp.unidade) === normalized(unitName);
}

export function userCanUseStamp(stamp: Stamp, user: Pick<User, "nome">, unitName: string, profile: string) {
  if (!stamp.activo || !stampBelongsToUnit(stamp, unitName)) return false;
  if (profile === "administracao") return true;
  if (stamp.utilizadoresAutorizados.length === 0) return true;
  const userName = normalized(user.nome);
  return stamp.utilizadoresAutorizados.some((authorized) => {
    const value = normalized(authorized);
    if (value === userName) return true;
    if (["todos", "todos os utilizadores", "todos os usuarios"].includes(value)) return true;
    if (value.includes("remetent") && profile === "remetente") return true;
    if (value.includes("secretar") && profile === "secretaria") return true;
    if ((value.includes("chef") || value.includes("superior") || value.includes("director")) && profile === "superior") return true;
    return false;
  });
}

export function signatureBelongsToUser(signature: Signature, user: Pick<User, "id" | "nome" | "email">) {
  if (signature.estado !== "activa") return false;
  if (signature.utilizadorId) return signature.utilizadorId === user.id;
  if (signature.email) return normalized(signature.email) === normalized(user.email);
  return normalized(signature.proprietario) === normalized(user.nome);
}

/**
 * The stamp for a department/service unit is fixed by the administrator, never
 * chosen by the acting user. A unit can have different operational stamps for
 * sender, secretary and approval flows, so callers pass the intended purpose
 * and the resolver picks the best matching active unit stamp. "Global" stamps
 * are annotation stamps, not substitutes for a missing unit identity stamp.
 */
export function resolveUnitStamp(stamps: Stamp[], user: Pick<User, "nome">, unitName: string, profile: string, purpose?: StampPurpose) {
  const resolvedPurpose = purpose ?? defaultPurposeForProfile(profile);
  const candidates = stamps.filter((stamp) => stamp.unidade !== "Global" && userCanUseStamp(stamp, user, unitName, profile));
  return candidates.sort((a, b) => stampPurposeScore(b, resolvedPurpose, profile) - stampPurposeScore(a, resolvedPurpose, profile))[0];
}

/** A user's own individual signature — at most one active match is expected. */
export function resolveUserSignature(signatures: Signature[], user: Pick<User, "id" | "nome" | "email">) {
  return signatures.find((signature) => signatureBelongsToUser(signature, user));
}

function defaultPurposeForProfile(profile: string): StampPurpose {
  if (profile === "remetente") return "remetente";
  if (profile === "secretaria") return "secretaria";
  if (profile === "superior") return "aprovacao";
  return "geral";
}

const PURPOSE_CATEGORIES: Record<StampPurpose, Stamp["categoria"][]> = {
  remetente: ["institucional", "funcional"],
  secretaria: ["protocolo", "recepcao"],
  aprovacao: ["aprovacao", "funcional", "institucional"],
  despacho: ["aprovacao", "institucional", "funcional"],
  geral: [],
};

const PURPOSE_TERMS: Record<StampPurpose, string[]> = {
  remetente: ["criacao", "submissao", "remetente", "expediente", "emissao"],
  secretaria: ["recepcao", "protocolo", "secretaria", "encaminhamento"],
  aprovacao: ["aprovacao", "rejeicao", "apreciacao", "decisao", "chefe", "superior", "director"],
  despacho: ["despacho", "aprovacao", "rejeicao", "decisao", "parecer", "chefe", "superior", "director"],
  geral: [],
};

function stampPurposeScore(stamp: Stamp, purpose: StampPurpose, profile: string) {
  let score = 0;
  const categoryIndex = PURPOSE_CATEGORIES[purpose].indexOf(stamp.categoria);
  if (categoryIndex >= 0) score += 80 - categoryIndex * 5;
  if (stamp.etapasPermitidas.some((item) => matchesPurposeTerm(item, purpose))) score += 35;
  if (stamp.utilizadoresAutorizados.some((item) => matchesPurposeTerm(item, purpose))) score += 25;
  if (stamp.tiposDocumento.some((item) => normalized(item) === "todos")) score += 4;
  if (profile === "superior" && stamp.categoria === "aprovacao") score += 8;
  if (profile === "secretaria" && (stamp.categoria === "protocolo" || stamp.categoria === "recepcao")) score += 8;
  if (profile === "remetente" && (stamp.categoria === "institucional" || stamp.categoria === "funcional")) score += 8;
  return score;
}

function matchesPurposeTerm(value: string, purpose: StampPurpose) {
  const text = normalized(value);
  return PURPOSE_TERMS[purpose].some((term) => text.includes(term));
}
