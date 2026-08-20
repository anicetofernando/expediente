import type { Signature, Stamp, User } from "@/types";

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
    if (value === "todos") return true;
    if (value.includes("chefes") && profile === "superior") return true;
    return false;
  });
}

export function signatureBelongsToUser(signature: Signature, user: Pick<User, "id" | "nome" | "email">) {
  if (signature.estado !== "activa") return false;
  if (signature.utilizadorId) return signature.utilizadorId === user.id;
  if (signature.email) return normalized(signature.email) === normalized(user.email);
  return normalized(signature.proprietario) === normalized(user.nome);
}
