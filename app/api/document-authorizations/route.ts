import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { stamps as defaultStamps } from "@/data/stamps";
import { signatures as defaultSignatures } from "@/data/signatures";
import { signatureBelongsToUser, userCanUseStamp } from "@/lib/document-authorization";
import type { Signature, Stamp } from "@/types";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  const result = await query<{ setting_key:string; setting_value:unknown }>(
    "SELECT setting_key,setting_value FROM system_settings WHERE setting_key IN ('catalogs','signatures')",
  );
  const values = Object.fromEntries(result.rows.map((row) => [row.setting_key, row.setting_value]));
  const catalogs = values.catalogs && typeof values.catalogs === "object" && !Array.isArray(values.catalogs) ? values.catalogs as {stamps?:unknown} : {};
  const stamps = Array.isArray(catalogs.stamps) ? catalogs.stamps as Stamp[] : defaultStamps;
  const signatures = Array.isArray(values.signatures) ? values.signatures as Signature[] : defaultSignatures;
  return NextResponse.json({
    stamps: stamps.filter((stamp) => userCanUseStamp(stamp, session.user, session.unitName, session.perfilNavegacao)),
    signatures: signatures.filter((signature) => signatureBelongsToUser(signature, session.user)),
  });
}
