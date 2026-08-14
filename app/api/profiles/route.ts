import { NextResponse } from "next/server";
import { audit, getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { listProfiles } from "@/lib/admin-db";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24);
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.perfilNavegacao !== "administracao") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  return NextResponse.json({ items: await listProfiles() });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.perfilNavegacao !== "administracao") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const input = await request.json().catch(() => null);
  if (!input?.nome?.trim() || !input?.descricao?.trim()) return NextResponse.json({ error: "Nome e descricao sao obrigatorios." }, { status: 400 });
  const base = slugify(input.nome) || "perfil";
  const id = `p-${base}-${Date.now().toString(36).slice(-5)}`;
  const slug = `${base}-${Date.now().toString(36).slice(-5)}`;
  await query(
    `INSERT INTO profiles(id,slug,name,description,access_level,scope,permissions,active)
     VALUES($1,$2,$3,$4,$5,$6,'[]'::jsonb,true)`,
    [id, slug, input.nome.trim(), input.descricao.trim(), input.nivel || "operacional", input.ambito || "unidade"],
  );
  await audit({ userId: session.user.id, action: "Perfil criado", entityType: "Perfil", entityId: id, details: { nome: input.nome.trim() } });
  return NextResponse.json({ ok: true, profile: (await listProfiles()).find((profile) => profile.id === id) }, { status: 201 });
}
