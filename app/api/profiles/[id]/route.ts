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
       access_level=COALESCE($4,access_level),
       permissions=COALESCE($5::jsonb,permissions),active=COALESCE($6,active)
     WHERE id=$1 RETURNING id`,
    [params.id, input.nome?.trim() || null, input.descricao?.trim() || null, input.nivel || null,
      Array.isArray(input.permissoes) ? JSON.stringify(input.permissoes) : null,
      typeof input.activo === "boolean" ? input.activo : null],
  );
  if (!result.rowCount) return NextResponse.json({ error: "Perfil nao encontrado." }, { status: 404 });
  await audit({ userId: session.user.id, action: "Perfil actualizado", entityType: "Perfil", entityId: params.id });
  return NextResponse.json({ ok: true });
}

const CORE_PROFILE_IDS = new Set(["p-remetente", "p-secretaria", "p-superior", "p-administracao"]);

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session || session.perfilNavegacao !== "administracao") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const existing = await query<{ slug: string; name: string }>("SELECT slug,name FROM profiles WHERE id=$1", [params.id]);
  if (!existing.rows[0]) return NextResponse.json({ error: "Perfil nao encontrado." }, { status: 404 });
  if (CORE_PROFILE_IDS.has(params.id)) return NextResponse.json({ error: "Este e' um perfil essencial do sistema e nao pode ser eliminado." }, { status: 400 });
  try {
    await query("DELETE FROM profiles WHERE id=$1", [params.id]);
    await audit({ userId: session.user.id, action: "Perfil eliminado", entityType: "Perfil", entityId: params.id, details: { nome: existing.rows[0].name } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("violates foreign key constraint")) return NextResponse.json({ error: "Este perfil tem utilizadores atribuidos e nao pode ser eliminado. Reatribua-os a outro perfil primeiro." }, { status: 409 });
    return NextResponse.json({ error: message || "Nao foi possivel eliminar." }, { status: 400 });
  }
}
