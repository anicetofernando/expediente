import { NextResponse } from "next/server";
import { audit, getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  const input = await request.json().catch(() => null) as { currentPassword?: string; newPassword?: string } | null;
  if (!input?.currentPassword || !input.newPassword || input.newPassword.length < 8) {
    return NextResponse.json({ error: "A nova palavra-passe deve ter pelo menos 8 caracteres." }, { status: 400 });
  }
  const result = await query<{ password_hash: string }>("SELECT password_hash FROM users WHERE id=$1", [session.user.id]);
  if (!result.rows[0] || !(await verifyPassword(input.currentPassword, result.rows[0].password_hash))) {
    await audit({ userId: session.user.id, action: "Alteracao de palavra-passe", entityType: "Utilizador", entityId: session.user.id, result: "falha" });
    return NextResponse.json({ error: "A palavra-passe actual esta incorrecta." }, { status: 400 });
  }
  await query("UPDATE users SET password_hash=$2,must_change_password=false WHERE id=$1", [session.user.id, await hashPassword(input.newPassword)]);
  await audit({ userId: session.user.id, action: "Palavra-passe actualizada", entityType: "Utilizador", entityId: session.user.id });
  return NextResponse.json({ ok: true });
}
