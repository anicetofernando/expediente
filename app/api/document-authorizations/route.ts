import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { stamps as defaultStamps } from "@/data/stamps";
import { signatures as defaultSignatures } from "@/data/signatures";
import { resolveUnitStamp, resolveUserSignature } from "@/lib/document-authorization";
import type { Signature, Stamp } from "@/types";

/**
 * Resolves the (single, fixed) stamp for a department/service unit and the caller's own
 * individual signature — never a list to choose from. Pass ?unidadeId= to resolve for a
 * unit other than the caller's own (e.g. the "unidade de origem" picked in the creation
 * wizard); omit it to resolve for the caller's own unit (e.g. when protocolling/despacho).
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  const unidadeId = request.nextUrl.searchParams.get("unidadeId");
  let unitName = session.unitName;
  if (unidadeId) {
    const unit = await query<{ name: string }>("SELECT name FROM organizational_units WHERE id=$1 AND active=true", [unidadeId]);
    if (!unit.rows[0]) return NextResponse.json({ error: "Unidade invalida." }, { status: 400 });
    unitName = unit.rows[0].name;
  }
  const result = await query<{ setting_key: string; setting_value: unknown }>(
    "SELECT setting_key,setting_value FROM system_settings WHERE setting_key IN ('catalogs','signatures')",
  );
  const values = Object.fromEntries(result.rows.map((row) => [row.setting_key, row.setting_value]));
  const catalogs = values.catalogs && typeof values.catalogs === "object" && !Array.isArray(values.catalogs) ? values.catalogs as { stamps?: unknown } : {};
  const stamps = Array.isArray(catalogs.stamps) ? catalogs.stamps as Stamp[] : defaultStamps;
  const signatures = Array.isArray(values.signatures) ? values.signatures as Signature[] : defaultSignatures;
  const stamp = resolveUnitStamp(stamps, session.user, unitName, session.perfilNavegacao);
  const signature = resolveUserSignature(signatures, session.user);
  return NextResponse.json({ stamp: stamp ?? null, signature: signature ?? null });
}
