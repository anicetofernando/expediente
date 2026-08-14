import { NextResponse } from "next/server";
import { audit, getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session || session.perfilNavegacao !== "administracao") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const input = await request.json().catch(() => null);
  if (!input) return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
  const result = await query(
    `UPDATE profiles SET name=COALESCE($2,name),description=COALESCE($3,description),
       access_level=COALESCE($4,access_level),scope=COALESCE($5,scope),
       permissions=COALESCE($6::jsonb,permissions),active=COALESCE($7,active)
     WHERE id=$1 RETURNING id`,
    [params.id, input.nome?.trim() || null, input.descricao?.trim() || null, input.nivel || null,
      input.ambito || null, Array.isArray(input.permissoes) ? JSON.stringify(input.permissoes) : null,
      typeof input.activo === "boolean" ? input.activo : null],
  );
  if (!result.rowCount) return NextResponse.json({ error: "Perfil nao encontrado." }, { status: 404 });
  await audit({ userId: session.user.id, action: "Perfil actualizado", entityType: "Perfil", entityId: params.id });
  return NextResponse.json({ ok: true });
}
