import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { audit, getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { saveFile } from "@/lib/file-storage";
import { hasPermission } from "@/lib/permissions";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".jpg", ".jpeg", ".png"]);
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function cleanName(name: string) {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-160) || "documento";
}

/**
 * Anexa um ficheiro ja formalizado (ex.: parecer/documento de suporte trazido
 * por quem aprova) a um expediente existente -- fica associado ao mesmo
 * processo, sem criar um novo numero. Distinto do documento "resposta" do
 * despacho: aqui e' so' um anexo de apoio, sem carimbo/assinatura do sistema.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  if (!hasPermission(session.profile.permissoes, ["documentos.anexar"])) {
    return NextResponse.json({ error: "O seu perfil nao tem permissao para anexar ficheiros." }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const filePart = form.get("file");
    const file = filePart instanceof File && filePart.size > 0 ? filePart : null;
    if (!file) return NextResponse.json({ error: "Seleccione um ficheiro." }, { status: 400 });
    const extension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) return NextResponse.json({ error: `Formato nao permitido: ${file.name}` }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: `O ficheiro ${file.name} excede 20 MB.` }, { status: 400 });

    const found = await query<{
      id: string; created_by: string; origin_unit_id: string; recipient_unit_id: string;
      responsible_user_id: string | null; confidentiality: string;
    }>(
      "SELECT id,created_by,origin_unit_id,recipient_unit_id,responsible_user_id,confidentiality FROM expedients WHERE id=$1",
      [params.id],
    );
    const exp = found.rows[0];
    if (!exp) return NextResponse.json({ error: "Expediente nao encontrado." }, { status: 404 });

    const collectiveUnitAccessAllowed = exp.confidentiality !== "confidencial" && exp.confidentiality !== "restrito";
    const hasAccess = session.perfilNavegacao === "administracao"
      || exp.created_by === session.user.id
      || exp.responsible_user_id === session.user.id
      || (collectiveUnitAccessAllowed && (session.perfilNavegacao === "superior" || session.perfilNavegacao === "secretaria")
        && (exp.origin_unit_id === session.user.unidadeId || exp.recipient_unit_id === session.user.unidadeId));
    if (!hasAccess) return NextResponse.json({ error: "Sem acesso a este expediente." }, { status: 403 });

    const documentId = randomUUID();
    const storedName = `${randomUUID()}-${cleanName(file.name)}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const relative = await saveFile("documents", `${exp.id}/${storedName}`, bytes, file.type || undefined);
    await query(
      `INSERT INTO documents(id,expedient_id,name,document_kind,source,mime_type,size_bytes,page_count,storage_path,confidentiality,created_by)
       VALUES($1,$2,$3,'anexo','importado',$4,$5,1,$6,$7,$8)`,
      [documentId, exp.id, file.name, file.type || "application/octet-stream", file.size, relative, exp.confidentiality, session.user.id],
    );
    await query(
      `INSERT INTO timeline_events(expedient_id,event_type,title,description,user_id,unit_id) VALUES($1,'comentario','Documento anexado',$2,$3,$4)`,
      [exp.id, `Anexado: ${file.name}`, session.user.id, session.user.unidadeId],
    );

    await audit({ userId: session.user.id, action: "Documento anexado", entityType: "Expediente", entityId: exp.id, details: { documentId, name: file.name } });
    revalidatePath(`/expedientes/${exp.id}`);
    return NextResponse.json({ ok: true, documentId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nao foi possivel anexar o ficheiro." }, { status: 400 });
  }
}
