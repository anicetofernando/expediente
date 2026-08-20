import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { saveFile } from "@/lib/file-storage";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg"]);
const MAX_SIZE = 4 * 1024 * 1024;

function cleanName(name: string) {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-120) || "imagem";
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.perfilNavegacao !== "administracao") return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Seleccione uma imagem." }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Formato nao suportado. Use PNG ou JPG." }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "A imagem excede 4 MB." }, { status: 400 });
    const storedName = `${randomUUID()}-${cleanName(file.name)}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await saveFile("assets", storedName, bytes, file.type, { addRandomSuffix: false });
    return NextResponse.json({ ok: true, url: `/api/admin/assets/${storedName}` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nao foi possivel carregar a imagem." }, { status: 400 });
  }
}
