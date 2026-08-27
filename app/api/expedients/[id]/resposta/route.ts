import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { audit, getCurrentSession } from "@/lib/auth";
import { transaction } from "@/lib/db";
import { sanitizeDocumentHtml } from "@/lib/sanitize-html";
import { templateSnapshot } from "@/lib/document-configuration";
import { rememberStampSignaturePositions, resolveMandatoryStampSignature, signatureMetadataJson, stampMetadataJson } from "@/lib/stamping";
import { saveFile } from "@/lib/file-storage";
import { hasAllPermissions } from "@/lib/permissions";
import type { FreePosition } from "@/types";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".jpg", ".jpeg", ".png"]);
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_STATUS = new Set(["aguardando_parecer", "aguardando_esclarecimento", "devolvido", "aprovado"]);

function cleanName(name: string) {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-160) || "documento";
}

function validateFile(file: File) {
  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) throw new Error(`Formato nao permitido: ${file.name}`);
  if (file.size > MAX_FILE_SIZE) throw new Error(`O ficheiro ${file.name} excede 20 MB.`);
}

interface DespachoInput {
  modo: "sistema" | "importado";
  documentId?: string;
  modeloId?: string;
  conteudo?: string;
  posicaoCarimbo?: FreePosition;
  posicaoAssinatura?: FreePosition;
  note?: string;
}

/**
 * Despacho/resposta de quem aprova: escrever no sistema (carimbo do departamento +
 * assinatura individual, com posicao) ou importar uma resposta ja formalizada (sem
 * carimbo/assinatura do sistema). Endpoint dedicado porque o fluxo "sistema" acontece
 * em duas chamadas: a primeira cria o documento (para gerar um PDF real a pre-visualizar
 * e posicionar), a segunda (com documentId) aplica a posicao escolhida.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  if (session.perfilNavegacao !== "superior" && session.perfilNavegacao !== "administracao") {
    return NextResponse.json({ error: "Sem permissao para criar despacho." }, { status: 403 });
  }
  try {
    const form = await request.formData();
    const raw = form.get("data");
    if (typeof raw !== "string") throw new Error("Dados do despacho em falta.");
    const input = JSON.parse(raw) as DespachoInput;
    if ((input.documentId || input.modo === "sistema") && !hasAllPermissions(session.profile.permissoes, ["carimbos.aplicar", "assinaturas.aplicar"])) {
      throw new Error("O seu perfil nao tem permissao para aplicar carimbo/assinatura no despacho.");
    }
    const filePart = form.get("file");
    const file = filePart instanceof File && filePart.size > 0 ? filePart : null;
    if (!input.documentId) {
      if (input.modo === "importado" && !file) throw new Error("Seleccione o ficheiro da resposta.");
      if (input.modo === "sistema") {
        const clean = sanitizeDocumentHtml(input.conteudo ?? "");
        if (!clean.replace(/<[^>]*>/g, "").trim()) throw new Error("Escreva o conteudo do despacho.");
      }
    }
    if (file) validateFile(file);

    const result = await transaction(async (client) => {
      const found = await client.query<{ id: string; protocol: string; subject: string; status: string; created_by: string; origin_unit_id: string; recipient_unit_id: string; responsible_user_id: string | null }>(
        "SELECT id,protocol,subject,status,created_by,origin_unit_id,recipient_unit_id,responsible_user_id FROM expedients WHERE id=$1 FOR UPDATE", [params.id],
      );
      const exp = found.rows[0];
      if (!exp) throw new Error("Expediente nao encontrado.");
      if (!ALLOWED_STATUS.has(exp.status)) throw new Error("Esta accao nao e valida no estado actual do expediente.");
      const hasAccess = session.perfilNavegacao === "administracao" || exp.responsible_user_id === session.user.id || exp.origin_unit_id === session.user.unidadeId || exp.recipient_unit_id === session.user.unidadeId;
      if (!hasAccess) throw new Error("Sem acesso a este expediente.");

      if (input.documentId) {
        const doc = await client.query<{ id: string }>("SELECT id FROM documents WHERE id=$1 AND expedient_id=$2 AND document_kind='resposta'", [input.documentId, exp.id]);
        if (!doc.rows[0]) throw new Error("Despacho nao encontrado.");
        const resolved = await resolveMandatoryStampSignature(client, session.user, session.unitName, session.perfilNavegacao);
        const stampEntry = JSON.stringify(stampMetadataJson(resolved.stamp, session.user.nome, input.posicaoCarimbo));
        const signatureEntry = JSON.stringify(signatureMetadataJson(resolved.signature, session.user, input.posicaoAssinatura));
        await client.query(
          "UPDATE documents SET stamp_metadata=$2::jsonb,signature_metadata=$3::jsonb,stamps_metadata=$4::jsonb,signatures_metadata=$5::jsonb WHERE id=$1",
          [input.documentId, stampEntry, signatureEntry, `[${stampEntry}]`, `[${signatureEntry}]`],
        );
        await rememberStampSignaturePositions(client, resolved.stamp, resolved.signature, input.posicaoCarimbo, input.posicaoAssinatura);
        return { documentId: input.documentId, finalized: true };
      }

      const documentId = randomUUID();
      if (input.modo === "sistema") {
        const clean = sanitizeDocumentHtml(input.conteudo ?? "");
        const template = await templateSnapshot(client, input.modeloId);
        const resolved = await resolveMandatoryStampSignature(client, session.user, session.unitName, session.perfilNavegacao);
        const stampEntry = JSON.stringify(stampMetadataJson(resolved.stamp, session.user.nome));
        const signatureEntry = JSON.stringify(signatureMetadataJson(resolved.signature, session.user));
        await client.query(
          `INSERT INTO documents(id,expedient_id,name,document_kind,source,mime_type,size_bytes,page_count,content_html,confidentiality,created_by,stamp_id,stamped,signed,stamp_metadata,signature_metadata,stamps_metadata,signatures_metadata,template_metadata)
           VALUES($1,$2,$3,'resposta','sistema','text/html',$4,1,$5,'interno',$6,$7,true,true,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb)`,
          [documentId, exp.id, `Despacho - ${exp.protocol}.html`, Buffer.byteLength(clean, "utf8"), clean, session.user.id, resolved.stamp.id,
            stampEntry, signatureEntry, `[${stampEntry}]`, `[${signatureEntry}]`, template ? JSON.stringify(template) : null],
        );
      } else if (file) {
        const bytes = Buffer.from(await file.arrayBuffer());
        const storedName = `${randomUUID()}-${cleanName(file.name)}`;
        const relative = await saveFile("documents", `${exp.id}/${storedName}`, bytes, file.type || undefined);
        await client.query(
          `INSERT INTO documents(id,expedient_id,name,document_kind,source,mime_type,size_bytes,page_count,storage_path,confidentiality,created_by)
           VALUES($1,$2,$3,'resposta','importado',$4,$5,1,$6,'interno',$7)`,
          [documentId, exp.id, file.name, file.type || "application/octet-stream", file.size, relative, session.user.id],
        );
      }
      await client.query(
        `INSERT INTO timeline_events(expedient_id,event_type,title,description,user_id,unit_id) VALUES($1,'resposta','Despacho registado',$2,$3,$4)`,
        [exp.id, input.note?.trim() || `Despacho anexado a ${exp.protocol}.`, session.user.id, session.user.unidadeId],
      );
      const notifyIds = new Set([exp.created_by, exp.responsible_user_id].filter((value): value is string => Boolean(value)));
      for (const userId of notifyIds) {
        if (userId !== session.user.id) {
          await client.query(
            "INSERT INTO notifications(user_id,notification_type,title,description,expedient_id,urgent) VALUES($1,'tarefa','Despacho registado',$2,$3,false)",
            [userId, `${exp.protocol} - ${exp.subject}`, exp.id],
          );
        }
      }
      return { documentId, finalized: input.modo === "importado" };
    });

    await audit({ userId: session.user.id, action: "Despacho registado", entityType: "Expediente", entityId: params.id, details: { documentId: result.documentId } });
    revalidatePath(`/expedientes/${params.id}`);
    revalidatePath("/expedientes");
    return NextResponse.json({ ok: true, documentId: result.documentId, pdfUrl: `/api/documents/${result.documentId}/pdf`, finalized: result.finalized });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nao foi possivel registar o despacho." }, { status: 400 });
  }
}
