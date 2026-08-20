import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { audit, getCurrentSession } from "@/lib/auth";
import { transaction } from "@/lib/db";
import { sanitizeDocumentHtml } from "@/lib/sanitize-html";
import type { Confidentiality, Priority } from "@/types";
import { isValidFutureOrTodayDate } from "@/lib/date-only";
import { templateSnapshot } from "@/lib/document-configuration";
import { resolveSecretaryId } from "@/lib/routing";
import { saveFile } from "@/lib/file-storage";
import { resolveMandatoryStampSignatureByUnitId, signatureMetadataJson, stampMetadataJson } from "@/lib/stamping";
import type { FreePosition } from "@/types";

export const runtime = "nodejs";

interface CreateInput {
  tipo: string; unidadeOrigem: string; remetente: string; destinatario: string; assunto: string;
  prioridade: Priority; confidencialidade: Confidentiality; prazo: string;
  origemDocumento: "sistema" | "importado" | "apenas-processo";
  modeloId?: string; conteudo?: string; ficheiroNome?: string; numPaginas?: number; rascunho?: boolean;
  usarCarimboAssinatura?: boolean; posicaoCarimbo?: FreePosition; posicaoAssinatura?: FreePosition;
  anexos?: Array<{ nome: string; descricao?: string; confidencialidade?: Confidentiality }>;
}

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

async function persistFile(expedientId: string, file: File) {
  validateFile(file);
  const storedName = `${randomUUID()}-${cleanName(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const relative = await saveFile("documents", `${expedientId}/${storedName}`, bytes, file.type || undefined);
  return { relative, mime: file.type || "application/octet-stream" };
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session || !["remetente", "administracao"].includes(session.perfilNavegacao)) {
    return NextResponse.json({ error: "Sem permissao para criar expedientes." }, { status: 403 });
  }
  try {
    const form = await request.formData();
    const raw = form.get("data");
    if (typeof raw !== "string") return NextResponse.json({ error: "Dados do expediente em falta." }, { status: 400 });
    const input = JSON.parse(raw) as CreateInput;
    if (session.perfilNavegacao === "remetente") input.remetente = session.user.nome;
    const required = [input.tipo,input.unidadeOrigem,input.remetente,input.destinatario,input.assunto,input.prioridade,input.confidencialidade,input.prazo,input.origemDocumento];
    if (required.some((value) => !value)) return NextResponse.json({ error: "Preencha todos os campos obrigatorios." }, { status: 400 });
    if (!isValidFutureOrTodayDate(input.prazo)) return NextResponse.json({ error: "A data de entrega nao pode ser anterior ao dia de hoje." }, { status: 400 });

    const mainPart = form.get("mainFile");
    const mainFile = mainPart instanceof File && mainPart.size > 0 ? mainPart : null;
    const attachmentFiles = form.getAll("attachments").filter((part): part is File => part instanceof File && part.size > 0);
    if (input.origemDocumento === "importado" && !mainFile) {
      return NextResponse.json({ error: "Seleccione o documento principal." }, { status: 400 });
    }
    const cleanHtml = input.origemDocumento === "sistema" ? sanitizeDocumentHtml(input.conteudo ?? "") : "";
    if (input.origemDocumento === "sistema" && !cleanHtml.replace(/<[^>]*>/g, "").trim()) {
      return NextResponse.json({ error: "Escreva o conteudo da carta." }, { status: 400 });
    }
    if (mainFile) validateFile(mainFile);
    attachmentFiles.forEach(validateFile);

    const created = await transaction(async (client) => {
      const unit = await client.query<{ acronym: string }>("SELECT acronym FROM organizational_units WHERE id=$1 AND active=true", [input.unidadeOrigem]);
      if (!unit.rows[0]) throw new Error("Unidade de origem invalida.");
      const template = input.origemDocumento === "sistema" ? await templateSnapshot(client, input.modeloId) : null;
      if (input.origemDocumento === "sistema" && !template) throw new Error("Seleccione um modelo de documento activo.");
      const expedientId = randomUUID();
      const year = new Date().getFullYear();
      let protocol = `RASCUNHO-${expedientId.slice(0,8).toUpperCase()}`;
      if (!input.rascunho) {
        const sequence = await client.query<{ value: number }>(`
          INSERT INTO number_sequences(unit_id,year,next_value) VALUES($1,$2,2)
          ON CONFLICT(unit_id,year) DO UPDATE SET next_value=number_sequences.next_value+1
          RETURNING next_value-1 value
        `, [input.unidadeOrigem,year]);
        protocol = `CFM/${unit.rows[0].acronym}/${year}/${String(sequence.rows[0].value).padStart(4,"0")}`;
      }
      const status = input.rascunho ? "rascunho" : "submetido";
      const responsible = input.rascunho ? session.user.id : await resolveSecretaryId(client, input.destinatario);
      if (!input.rascunho && !responsible) throw new Error("Nao existe utilizador activo da Secretaria.");
      const result = await client.query<{ id: string; protocol: string }>(`
        INSERT INTO expedients(id,protocol,subject,document_type,status,priority,confidentiality,sender_name,origin_unit_id,recipient_unit_id,responsible_user_id,origin_secretary_id,created_by,due_date,next_step,submitted_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::timestamptz)
        RETURNING id,protocol
      `,[expedientId,protocol,input.assunto.trim(),input.tipo,status,input.prioridade,input.confidencialidade,input.remetente.trim(),input.unidadeOrigem,input.destinatario,responsible,input.rascunho ? null : responsible,session.user.id,input.prazo,input.rascunho ? "Continuar a edicao" : "Recepcao pela Secretaria",input.rascunho ? null : new Date().toISOString()]);
      const expedient = result.rows[0];

      let documentId: string | null = null;
      if (input.origemDocumento === "sistema") {
        let stampId: string | null = null;
        let stampMeta: string | null = null;
        let sigMeta: string | null = null;
        if (input.usarCarimboAssinatura) {
          const resolved = await resolveMandatoryStampSignatureByUnitId(client, input.unidadeOrigem, session.user, session.perfilNavegacao);
          stampId = resolved.stamp.id;
          stampMeta = JSON.stringify(stampMetadataJson(resolved.stamp, session.user.nome, input.posicaoCarimbo));
          sigMeta = JSON.stringify(signatureMetadataJson(resolved.signature, session.user, input.posicaoAssinatura));
        }
        const inserted = await client.query<{ id: string }>(
          `INSERT INTO documents(expedient_id,name,document_kind,source,mime_type,size_bytes,page_count,content_html,confidentiality,created_by,stamp_id,stamped,signed,stamp_metadata,signature_metadata,template_metadata)
           VALUES($1,$2,'principal','sistema','text/html',$3,1,$4,$5,$6,$7,$8,$8,$9::jsonb,$10::jsonb,$11::jsonb) RETURNING id`,
          [expedient.id,`${input.assunto.trim()}.html`,Buffer.byteLength(cleanHtml,"utf8"),cleanHtml,input.confidencialidade,session.user.id,stampId,Boolean(stampId),stampMeta,sigMeta,template ? JSON.stringify(template) : null],
        );
        documentId = inserted.rows[0].id;
      } else if (mainFile) {
        const stored = await persistFile(expedient.id, mainFile);
        const inserted = await client.query<{ id: string }>(
          `INSERT INTO documents(expedient_id,name,document_kind,source,mime_type,size_bytes,page_count,storage_path,confidentiality,created_by) VALUES($1,$2,'principal','importado',$3,$4,$5,$6,$7,$8) RETURNING id`,
          [expedient.id,mainFile.name,stored.mime,mainFile.size,Math.max(1,input.numPaginas ?? 1),stored.relative,input.confidencialidade,session.user.id],
        );
        documentId = inserted.rows[0].id;
      }
      for (let index=0; index<attachmentFiles.length; index++) {
        const file = attachmentFiles[index];
        const meta = input.anexos?.[index];
        const stored = await persistFile(expedient.id,file);
        await client.query(`INSERT INTO documents(expedient_id,name,document_kind,source,mime_type,size_bytes,page_count,storage_path,confidentiality,created_by) VALUES($1,$2,'anexo','importado',$3,$4,1,$5,$6,$7)`,
          [expedient.id,file.name,stored.mime,file.size,stored.relative,meta?.confidencialidade || input.confidencialidade,session.user.id]);
      }
      await client.query(`INSERT INTO timeline_events(expedient_id,event_type,title,description,user_id,unit_id) VALUES($1,$2,$3,$4,$5,$6)`,
        [expedient.id,input.rascunho ? "criacao" : "submissao",input.rascunho ? "Rascunho criado" : "Expediente submetido",input.rascunho ? "Guardado para continuar mais tarde." : "Enviado para recepcao e protocolo.",session.user.id,session.user.unidadeId]);
      if (!input.rascunho) {
        await client.query(`INSERT INTO notifications(user_id,notification_type,title,description,expedient_id,urgent) SELECT u.id,'tarefa','Novo expediente submetido',$2,$1,$3 FROM users u JOIN user_profiles up ON up.user_id=u.id JOIN profiles p ON p.id=up.profile_id WHERE p.slug='secretaria' AND u.status='activo'`,
          [expedient.id,`${protocol} aguarda recepcao.`,input.prioridade === "urgente"]);
      }
      return { ...expedient, documentId };
    });
    await audit({ userId:session.user.id,action:input.rascunho ? "Expediente guardado" : "Expediente submetido",entityType:"Expediente",entityId:created.id,details:{ protocol:created.protocol },ip:request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null });
    return NextResponse.json({ ok:true,id:created.id,protocolo:created.protocol,rascunho:input.rascunho === true,documentId:created.documentId,pdfUrl:created.documentId ? `/api/documents/${created.documentId}/pdf` : null },{ status:201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel criar o expediente.";
    return NextResponse.json({ error:message },{ status:400 });
  }
}
