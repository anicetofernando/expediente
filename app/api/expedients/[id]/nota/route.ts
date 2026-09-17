import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { audit, getCurrentSession } from "@/lib/auth";
import { transaction } from "@/lib/db";
import { sanitizeDocumentHtml } from "@/lib/sanitize-html";
import { templateSnapshot } from "@/lib/document-configuration";
import { saveFile } from "@/lib/file-storage";
import { generateProtocolNumber } from "@/lib/numbering";
import { targetResponsible } from "@/lib/routing";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".jpg", ".jpeg", ".png"]);
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function cleanName(name: string) {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-160) || "documento";
}

function validateFile(file: File) {
  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) throw new Error(`Formato nao permitido: ${file.name}`);
  if (file.size > MAX_FILE_SIZE) throw new Error(`O ficheiro ${file.name} excede 20 MB.`);
}

interface NotaInput {
  modo: "sistema" | "importado";
  modeloId?: string;
  conteudo?: string;
  note?: string;
  /** O assunto da nota e' escrito pela Secretaria -- nunca herdado
   * automaticamente do expediente original. */
  assunto?: string;
}

/**
 * A Secretaria cria a Nota de encaminhamento -- escrita no sistema ou
 * importada -- mas nunca a assina nem carimba: ela e' so' quem protocola e
 * transmite. Quem marca a nota com carimbo/assinatura e' sempre o chefe de
 * servico ou o director, quando a recebe e decide (aprovar, aprovar para
 * nova nota, encaminhar, pedir parecer ou rejeitar). O expediente original
 * fica sempre visivel junto, como outro documento do mesmo processo -- a
 * nota nunca o substitui.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  if (session.perfilNavegacao !== "secretaria" && session.perfilNavegacao !== "administracao") {
    return NextResponse.json({ error: "Sem permissao para criar nota de encaminhamento." }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const raw = form.get("data");
    if (typeof raw !== "string") throw new Error("Dados da nota em falta.");
    const input = JSON.parse(raw) as NotaInput;
    const filePart = form.get("file");
    const file = filePart instanceof File && filePart.size > 0 ? filePart : null;
    if (!input.assunto?.trim()) throw new Error("Escreva o assunto da nota.");
    if (input.modo === "importado" && !file) throw new Error("Seleccione o ficheiro da nota.");
    if (input.modo === "sistema") {
      const clean = sanitizeDocumentHtml(input.conteudo ?? "");
      if (!clean.replace(/<[^>]*>/g, "").trim()) throw new Error("Escreva o conteudo da nota.");
    }
    if (file) validateFile(file);

    const result = await transaction(async (client) => {
      const found = await client.query<{
        id: string; protocol: string; subject: string; status: string; created_by: string; origin_unit_id: string;
        recipient_unit_id: string; responsible_user_id: string | null; confidentiality: string; pending_next_status: string | null;
      }>(
        "SELECT id,protocol,subject,status,created_by,origin_unit_id,recipient_unit_id,responsible_user_id,confidentiality,pending_next_status FROM expedients WHERE id=$1 FOR UPDATE",
        [params.id],
      );
      const exp = found.rows[0];
      if (!exp) throw new Error("Expediente nao encontrado.");
      if (exp.status !== "nota_pendente") throw new Error("Esta accao nao e valida no estado actual do expediente.");
      const collectiveUnitAccessAllowed = exp.confidentiality !== "confidencial" && exp.confidentiality !== "restrito";
      const hasAccess = session.perfilNavegacao === "administracao"
        || exp.responsible_user_id === session.user.id
        || (collectiveUnitAccessAllowed && (exp.origin_unit_id === session.user.unidadeId || exp.recipient_unit_id === session.user.unidadeId));
      if (!hasAccess) throw new Error("Sem acesso a este expediente.");

      async function completeHandoff() {
        const nextResponsible = await targetResponsible(client, exp.recipient_unit_id);
        await client.query(
          "UPDATE expedients SET status=$2,responsible_user_id=$3,pending_next_status=NULL,next_step=$4 WHERE id=$1",
          [exp.id, exp.pending_next_status ?? "encaminhado", nextResponsible, "Analise e decisao da unidade responsavel"],
        );
        return nextResponsible;
      }

      // A nota e' sempre criada em branco -- a Secretaria nunca a assina nem
      // carimba, so' protocola e transmite. Quem a marca e' sempre o chefe de
      // servico/director, quando a recebe e decide.
      const isCobertura = exp.pending_next_status === "nota_cobertura";

      const documentId = randomUUID();
      const unit = await client.query<{ acronym: string }>(
        "SELECT acronym FROM organizational_units WHERE id=$1 AND active=true", [session.user.unidadeId],
      );
      const documentNumber = unit.rows[0]
        ? await generateProtocolNumber(client, session.user.unidadeId, unit.rows[0].acronym, new Date().getFullYear())
        : null;
      if (input.modo === "sistema") {
        const clean = sanitizeDocumentHtml(input.conteudo ?? "");
        const template = await templateSnapshot(client, input.modeloId);
        await client.query(
          `INSERT INTO documents(id,expedient_id,name,document_kind,source,mime_type,size_bytes,page_count,content_html,confidentiality,created_by,stamped,signed,stamps_metadata,signatures_metadata,template_metadata,document_number,created_for_unit_id,subject)
           VALUES($1,$2,$3,'nota','sistema','text/html',$4,1,$5,'interno',$6,false,false,'[]'::jsonb,'[]'::jsonb,$7::jsonb,$8,$9,$10)`,
          [documentId, exp.id, `${isCobertura ? "Nota de cobertura" : "Nota"} - ${exp.protocol}.html`, Buffer.byteLength(clean, "utf8"), clean, session.user.id,
            template ? JSON.stringify(template) : null, documentNumber, exp.recipient_unit_id, input.assunto?.trim()],
        );
      } else if (file) {
        const bytes = Buffer.from(await file.arrayBuffer());
        const storedName = `${randomUUID()}-${cleanName(file.name)}`;
        const relative = await saveFile("documents", `${exp.id}/${storedName}`, bytes, file.type || undefined);
        await client.query(
          `INSERT INTO documents(id,expedient_id,name,document_kind,source,mime_type,size_bytes,page_count,storage_path,confidentiality,created_by,document_number,created_for_unit_id,subject)
           VALUES($1,$2,$3,'nota','importado',$4,$5,1,$6,'interno',$7,$8,$9,$10)`,
          [documentId, exp.id, file.name, file.type || "application/octet-stream", file.size, relative, session.user.id, documentNumber, exp.recipient_unit_id, input.assunto?.trim()],
        );
      }

      const nextResponsible = await completeHandoff();
      const eventTitle = isCobertura ? "Nota de cobertura emitida" : "Nota de encaminhamento criada";
      await client.query(
        `INSERT INTO timeline_events(expedient_id,event_type,title,description,user_id,unit_id) VALUES($1,'nota',$2,$3,$4,$5)`,
        [exp.id, eventTitle, input.note?.trim() || `${eventTitle} sobre ${exp.protocol}.`, session.user.id, session.user.unidadeId],
      );
      const notifyIds = new Set([exp.created_by, exp.responsible_user_id, nextResponsible].filter((value): value is string => Boolean(value)));
      for (const userId of notifyIds) {
        if (userId !== session.user.id) {
          await client.query(
            "INSERT INTO notifications(user_id,notification_type,title,description,expedient_id,urgent) VALUES($1,'tarefa',$2,$3,$4,false)",
            [userId, eventTitle, `${exp.protocol} - ${exp.subject}`, exp.id],
          );
        }
      }
      return { documentId, finalized: input.modo === "importado", nextResponsible };
    });

    await audit({ userId: session.user.id, action: "Nota de encaminhamento criada", entityType: "Expediente", entityId: params.id, details: { documentId: result.documentId } });
    revalidatePath(`/expedientes/${params.id}`);
    revalidatePath("/expedientes");
    revalidatePath("/secretaria");
    return NextResponse.json({ ok: true, documentId: result.documentId, pdfUrl: `/api/documents/${result.documentId}/pdf`, finalized: result.finalized });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nao foi possivel criar a nota." }, { status: 400 });
  }
}
