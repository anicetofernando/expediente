import type { PoolClient } from "pg";
import type { FreePosition, Signature, Stamp, User } from "@/types";
import { resolveUnitStamp, resolveUserSignature } from "@/lib/document-authorization";
import { configuredSignatures, configuredStamps, rememberSignaturePosition, rememberStampPosition } from "@/lib/document-configuration";

export interface StampSignatureResolution {
  stamp: Stamp;
  signature: Signature;
}

/**
 * Resolves the fixed unit stamp + the acting user's own signature. Both are mandatory:
 * the system never applies just one of the two — if either is missing the caller must
 * stop and report which one needs to be configured by the administrator.
 */
export async function resolveMandatoryStampSignature(
  client: PoolClient,
  user: Pick<User, "id" | "nome" | "email">,
  unitName: string,
  profile: string,
): Promise<StampSignatureResolution> {
  const [stamps, signatures] = await Promise.all([configuredStamps(client), configuredSignatures(client)]);
  const stamp = resolveUnitStamp(stamps, user, unitName, profile);
  const signature = resolveUserSignature(signatures, user);
  if (!stamp) throw new Error("A sua unidade ainda nao tem um carimbo configurado. Contacte a administracao.");
  if (!signature) throw new Error("Nao tem uma assinatura configurada. Contacte a administracao.");
  return { stamp, signature };
}

/** Same as resolveMandatoryStampSignature, but resolves the unit by id (e.g. the "unidade de origem" chosen in the creation wizard, which need not be the acting user's own unit). */
export async function resolveMandatoryStampSignatureByUnitId(
  client: PoolClient,
  unitId: string,
  user: Pick<User, "id" | "nome" | "email">,
  profile: string,
): Promise<StampSignatureResolution> {
  const unit = await client.query<{ name: string }>("SELECT name FROM organizational_units WHERE id=$1 AND active=true", [unitId]);
  if (!unit.rows[0]) throw new Error("Unidade de origem invalida.");
  return resolveMandatoryStampSignature(client, user, unit.rows[0].name, profile);
}

export function stampMetadataJson(stamp: Stamp, actorName: string, posicao?: FreePosition) {
  return {
    id: stamp.id,
    nome: stamp.nome,
    posicao: stamp.posicao,
    unidade: stamp.unidade,
    aplicadoPor: actorName,
    aplicadoEm: new Date().toISOString(),
    imagemUrl: stamp.imagemUrl,
    posicaoLivre: stamp.imagemUrl && posicao ? posicao : undefined,
  };
}

export function signatureMetadataJson(signature: Signature, actor: { id: string; nome: string }, posicao?: FreePosition) {
  return {
    id: signature.id,
    utilizadorId: actor.id,
    proprietario: signature.proprietario,
    cargo: signature.cargo,
    aplicadoPor: actor.nome,
    aplicadoEm: new Date().toISOString(),
    imagemUrl: signature.imagemUrl,
    posicaoLivre: signature.imagemUrl && posicao ? posicao : undefined,
  };
}

export async function rememberStampSignaturePositions(
  client: PoolClient,
  stamp: Stamp,
  signature: Signature,
  posicaoCarimbo?: FreePosition,
  posicaoAssinatura?: FreePosition,
) {
  if (stamp.imagemUrl && posicaoCarimbo) await rememberStampPosition(client, stamp.id, posicaoCarimbo);
  if (signature.imagemUrl && posicaoAssinatura) await rememberSignaturePosition(client, signature.id, posicaoAssinatura);
}
