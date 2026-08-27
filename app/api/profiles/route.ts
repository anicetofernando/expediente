import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { listProfiles } from "@/lib/admin-db";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.perfilNavegacao !== "administracao") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  return NextResponse.json({ items: await listProfiles() });
}

// Nao existe POST: o sistema tem exactamente 4 perfis fixos (remetente, secretaria,
// superior, administracao) - a coluna profiles.slug tem UNIQUE + CHECK restrito a esses
// 4 valores, por isso nao e possivel criar um novo perfil. Só se editam os 4 existentes.
