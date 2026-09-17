import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { audit, getCurrentSession } from "@/lib/auth";
import { transaction } from "@/lib/db";
import { sanitizeDocumentHtml } from "@/lib/sanitize-html";
import { templateSnapshot } from "@/lib/document-configuration";
import { rememberStampSignaturePositions, resolveOptionalStampSignature, signatureMetadataJson, stampMetadataJson } from "@/lib/stamping";
import { saveFile } from "@/lib/file-storage";
import { generateProtocolNumber } from "@/lib/numbering";
import { targetResponsible } from "@/lib/routing";
import type { FreePosition } from "@/types";

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
  documentId?: string;
  modeloId?: string;
  conteudo?: string;
  posicaoCarimbo?: FreePosition;
  posicaoAssinatura?: FreePosition;
  note?: string;
  /** A Secretaria escolhe explicitamente se a nota leva tambem o carimbo da
   * unidade -- nunca e' aplicado automaticamente so por estar configurado.
   * So se aplica a primeira nota de cada salto -- a nota de cobertura nunca
   * leva carimbo nem assinatura da Secretaria. */
  incluirCarimbo?: boolean;
  /** O assunto da nota e' escrito pela Secretaria -- nunca herdado
   * automaticamente do expediente original. */
  assunto?: string;
}

/**
 * A Secretaria cria a Nota de encaminhamento -- escrita no sistema ou
 * importada, com a sua assinatura pessoal (obrigatoria) e o carimbo da
 * unidade (opcional). A unica excepcao e' a nota de cobertura
 * (pending_next_status="nota_cobertura"): essa fica sempre em branco, porque
 * quem a assina/carimba e' o chefe de servico/director, mais tarde, ao
 * encaminhar ou pedir parecer. O expediente original fica sempre visivel
 * junto, como outro documento do mesmo processo -- a nota nunca o substitui.
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
    if (!input.documentId) {
      if (!input.assunto?.trim()) throw new Error("Escreva o assunto da nota.");
      if (input.modo === "importado" && !file) throw new Error("Seleccione o ficheiro da nota.");
      if (input.modo === "sistema") {
        const clean = sanitizeDocumentHtml(input.conteudo ?? "");
        if (!clean.replace(/<[^>]*>/g, "").trim()) throw new Error("Escreva o conteudo da nota.");
      }
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

      // Nota de cobertura: a Secretaria so' cria o documento em branco -- nao
      // assina nem carimba. Quem o faz e' o chefe de servico, mais tarde, ao
      // encaminhar ou pedir parecer (estado "nota_cobertura"). Em qualquer
      // outro caso (a primeira nota de cada salto), a Secretaria assina (e,
      // se escolher, carimba) a nota no proprio acto de a criar.
      const isCobertura = exp.pending_next_status === "nota_cobertura";

      if (input.documentId) {
        const doc = await client.query<{ id: string }>("SELECT id FROM documents WHERE id=$1 AND expedient_id=$2 AND document_kind='nota'", [input.documentId, exp.id]);
        if (!doc.rows[0]) throw new Error("Nota nao encontrada.");
        const resolved = await resolveOptionalStampSignature(client, session.user, session.unitName, session.perfilNavegacao);
        if (!input.incluirCarimbo) resolved.stamp = null;
        const signatureEntry = JSON.stringify(signatureMetadataJson(resolved.signature, session.user, input.posicaoAssinatura));
        const stampEntry = resolved.stamp ? JSON.stringify(stampMetadataJson(resolved.stamp, session.user.nome, input.posicaoCarimbo)) : null;
        await client.query(
          "UPDATE documents SET signature_metadata=$2::jsonb,signatures_metadata=$3::jsonb,stamp_metadata=COALESCE($4::jsonb,stamp_metadata),stamps_metadata=COALESCE($5::jsonb,stamps_metadata),stamped=$6,signed=true WHERE id=$1",
          [input.documentId, signatureEntry, `[${signatureEntry}]`, stampEntry, stampEntry ? `[${stampEntry}]` : null, Boolean(resolved.stamp)],
        );
        if (resolved.stamp) await rememberStampSignaturePositions(client, resolved.stamp, resolved.signature, input.posicaoCarimbo, input.posicaoAssinatura);
        const nextResponsible = await completeHandoff();
        return { documentId: input.documentId, finalized: true, nextResponsible };
      }

      const documentId = randomUUID();
      const unit = await client.query<{ acronym: string }>(
        "SELECT acronym FROM organizational_units WHERE id=$1 AND active=true", [session.user.unidadeId],
      );
      const documentNumber = unit.rows[0]
        ? await generateProtocolNumber(client, session.user.unidadeId, unit.rows[0].acronym, new Date().getFullYear())
        : null;
      let sistemaHasFreePositionImages = false;
      if (input.modo === "sistema") {
        const clean = sanitizeDocumentHtml(input.conteudo ?? "");
        const template = await templateSnapshot(client, input.modeloId);
        let stampId: string | null = null;
        let stamped = false;
        let signed = false;
        let stampEntry: string | null = null;
        let signatureEntry: string | null = null;
        if (!isCobertura) {
          const resolved = await resolveOptionalStampSignature(client, session.user, session.unitName, session.perfilNavegacao);
          if (!input.incluirCarimbo) resolved.stamp = null;
          sistemaHasFreePositionImages = Boolean(resolved.stamp?.imagemUrl || resolved.signature.imagemUrl);
          signatureEntry = JSON.stringify(signatureMetadataJson(resolved.signature, session.user));
          stampEntry = resolved.stamp ? JSON.stringify(stampMetadataJson(resolved.stamp, session.user.nome)) : null;
          stampId = resolved.stamp?.id ?? null;
          stamped = Boolean(resolved.stamp);
          signed = true;
        }
        await client.query(
          `INSERT INTO documents(id,expedient_id,name,document_kind,source,mime_type,size_bytes,page_count,content_html,confidentiality,created_by,stamp_id,stamped,signed,stamp_metadata,signature_metadata,stamps_metadata,signatures_metadata,template_metadata,document_number,created_for_unit_id,subject)
           VALUES($1,$2,$3,'nota','sistema','text/html',$4,1,$5,'interno',$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb,$14::jsonb,$15,$16,$17)`,
          [documentId, exp.id, `${isCobertura ? "Nota de cobertura" : "Nota"} - ${exp.protocol}.html`, Buffer.byteLength(clean, "utf8"), clean, session.user.id, stampId,
            stamped, signed, stampEntry, signatureEntry, stampEntry ? `[${stampEntry}]` : "[]", signatureEntry ? `[${signatureEntry}]` : "[]", template ? JSON.stringify(template) : null, documentNumber, exp.recipient_unit_id, input.assunto?.trim()],
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

      let nextResponsible: string | null = null;
      if (input.modo === "importado" || !sistemaHasFreePositionImages) {
        nextResponsible = await completeHandoff();
      }
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
