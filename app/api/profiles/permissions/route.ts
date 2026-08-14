import { NextResponse } from "next/server";
import { audit, getCurrentSession } from "@/lib/auth";
import { transaction } from "@/lib/db";

export async function PUT(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.perfilNavegacao !== "administracao") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const input = await request.json().catch(() => null) as { profiles?: Record<string, unknown> } | null;
  if (!input?.profiles || typeof input.profiles !== "object") return NextResponse.json({ error: "Permissoes invalidas." }, { status: 400 });
  await transaction(async (client) => {
    for (const [profileId, permissions] of Object.entries(input.profiles!)) {
      if (!Array.isArray(permissions) || !permissions.every((item) => typeof item === "string")) throw new Error("Permissoes invalidas.");
      await client.query("UPDATE profiles SET permissions=$2::jsonb WHERE id=$1", [profileId, JSON.stringify(permissions)]);
    }
  });
  await audit({ userId: session.user.id, action: "Matriz de permissoes actualizada", entityType: "Perfil", entityId: "matrix" });
  return NextResponse.json({ ok: true });
}
