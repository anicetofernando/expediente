import { NextResponse } from "next/server";
import { audit, getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";

const ALLOWED_KEYS = new Set(["workflows-ui", "signatures", "numbering", "notification-rules", "general-configuration"]);

export async function GET(_request: Request, { params }: { params: { key: string } }) {
  const session = await getCurrentSession();
  if (!session || session.perfilNavegacao !== "administracao") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  if (!ALLOWED_KEYS.has(params.key)) return NextResponse.json({ error: "Configuracao desconhecida." }, { status: 404 });
  const result = await query<{ setting_value: unknown }>("SELECT setting_value FROM system_settings WHERE setting_key=$1", [params.key]);
  return NextResponse.json({ value: result.rows[0]?.setting_value ?? null });
}

export async function PUT(request: Request, { params }: { params: { key: string } }) {
  const session = await getCurrentSession();
  if (!session || session.perfilNavegacao !== "administracao") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  if (!ALLOWED_KEYS.has(params.key)) return NextResponse.json({ error: "Configuracao desconhecida." }, { status: 404 });
  const input = await request.json().catch(() => null) as { value?: unknown } | null;
  if (!input || !("value" in input)) return NextResponse.json({ error: "Valor em falta." }, { status: 400 });
  await query(
    `INSERT INTO system_settings(setting_key,setting_value,updated_by) VALUES($1,$2::jsonb,$3)
     ON CONFLICT(setting_key) DO UPDATE SET setting_value=EXCLUDED.setting_value,updated_by=EXCLUDED.updated_by,updated_at=now()`,
    [params.key, JSON.stringify(input.value), session.user.id],
  );
  await audit({ userId: session.user.id, action: "Configuracao actualizada", entityType: "Configuracao", entityId: params.key });
  return NextResponse.json({ ok: true });
}
