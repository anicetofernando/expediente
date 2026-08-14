import { NextResponse } from "next/server";
import { audit, getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.perfilNavegacao !== "administracao") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const input = await request.json().catch(() => null) as { rule?: { nome?: string; evento?: string; urgente?: boolean } } | null;
  if (!input?.rule?.nome) return NextResponse.json({ error: "Regra invalida." }, { status: 400 });
  await query(`INSERT INTO notifications(user_id,notification_type,title,description,urgent) VALUES($1,'sistema',$2,$3,$4)`, [session.user.id, `Teste: ${input.rule.nome}`, input.rule.evento || "Teste de regra administrativa", input.rule.urgente === true]);
  await audit({ userId: session.user.id, action: "Regra de notificacao testada", entityType: "Notificacao", entityId: input.rule.nome });
  return NextResponse.json({ ok: true });
}
