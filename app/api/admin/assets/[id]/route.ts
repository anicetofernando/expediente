import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { loadFileByPathname } from "@/lib/file-storage";

export const runtime = "nodejs";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  if (params.id.includes("/") || params.id.includes("..")) return NextResponse.json({ error: "Caminho invalido." }, { status: 400 });
  const data = await loadFileByPathname("assets", params.id);
  if (!data) return NextResponse.json({ error: "Imagem nao encontrada." }, { status: 404 });
  const mime = MIME_BY_EXT[path.extname(params.id).toLowerCase()] ?? "application/octet-stream";
  return new NextResponse(data, { headers: { "content-type": mime, "cache-control": "private, max-age=3600" } });
}
