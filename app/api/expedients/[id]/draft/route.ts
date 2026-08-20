import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { audit, getCurrentSession } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { sanitizeDocumentHtml } from "@/lib/sanitize-html";
import type { Confidentiality, Priority } from "@/types";
import { dateValueInMaputo, isValidFutureOrTodayDate } from "@/lib/date-only";
import { templateSnapshot } from "@/lib/document-configuration";
import { resolveSecretaryId } from "@/lib/routing";
import { saveFile } from "@/lib/file-storage";
import { resolveMandatoryStampSignatureByUnitId, signatureMetadataJson, stampMetadataJson } from "@/lib/stamping";
import type { DocumentTemplate, FreePosition } from "@/types";

export const runtime = "nodejs";

interface DraftInput {
  tipo: string; unidadeOrigem: string; remetente: string; destinatario: string; assunto: string;
  prioridade: Priority; confidencialidade: Confidentiality; prazo: string;
  origemDocumento: "sistema" | "importado" | "apenas-processo";
  modeloId?: string; conteudo?: string; numPaginas?: number; rascunho?: boolean;
  usarCarimboAssinatura?: boolean; posicaoCarimbo?: FreePosition; posicaoAssinatura?: FreePosition;
  anexos?: Array<{ id: string; nome: string; descricao?: string; confidencialidade?: Confidentiality }>;
}

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".jpg", ".jpeg", ".png"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateFile(file: File) {
  if (!ALLOWED_EXTENSIONS.has(path.extname(file.name).toLowerCase())) throw new Error(`Formato nao permitido: ${file.name}`);
  if (file.size > 20 * 1024 * 1024) throw new Error(`O ficheiro ${file.name} excede 20 MB.`);
}

async function persistFile(expedientId: string, file: File) {
  validateFile(file);
  const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-160) || "documento";
  const storedName = `${randomUUID()}-${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const relative = await saveFile("documents", `${expedientId}/${storedName}`, bytes, file.type || undefined);
  return { relative, mime: file.type || "application/octet-stream" };
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  const result = await query<{
    id:string;protocol:string;subject:string;document_type:string;status:string;priority:Priority;confidentiality:Confidentiality;
    sender_name:string;origin_unit_id:string;recipient_unit_id:string;due_date:string|Date;created_by:string;
    document_id:string|null;name:string|null;source:string|null;content_html:string|null;page_count:number|null;
    stamp_id:string|null;signature_requested:boolean|null;template_metadata:Partial<DocumentTemplate>|null;
  }>(`SELECT e.id,e.protocol,e.subject,e.document_type,e.status,e.priority,e.confidentiality,e.sender_name,
             e.origin_unit_id,e.recipient_unit_id,e.due_date,e.created_by,
             d.id document_id,d.name,d.source,d.content_html,d.page_count,d.stamp_id,d.signature_requested,d.template_metadata
        FROM expedients e
        LEFT JOIN documents d ON d.expedient_id=e.id AND d.document_kind='principal'
       WHERE e.id=$1 LIMIT 1`, [params.id]);
  const row = result.rows[0];
  if (!row) return NextResponse.json({ error: "Rascunho nao encontrado." }, { status: 404 });
  if (row.status !== "rascunho" || (row.created_by !== session.user.id && session.perfilNavegacao !== "administracao")) {
    return NextResponse.json({ error: "Este expediente nao pode ser editado como rascunho." }, { status: 403 });
  }
  const attachments = await query<{id:string;name:string;size_bytes:string;confidentiality:Confidentiality}>(
    "SELECT id,name,size_bytes,confidentiality FROM documents WHERE expedient_id=$1 AND document_kind='anexo' ORDER BY created_at", [params.id],
  );
  const origin = row.source === "digitalizado" ? "importado" : row.source ?? "apenas-processo";
  return NextResponse.json({
    id: row.id,
    protocolo: row.protocol,
    draft: {
      tipo: row.document_type, unidadeOrigem: row.origin_unit_id, remetente: row.sender_name,
      destinatario: row.recipient_unit_id, assunto: row.subject, prioridade: row.priority,
      confidencialidade: row.confidentiality, prazo: dateValueInMaputo(row.due_date),
      origemDocumento: origin, modeloId: row.source === "sistema" ? row.template_metadata?.id ?? "tpl-oficio" : "",
      conteudo: row.content_html ?? "", ficheiroNome: row.source && row.source !== "sistema" ? row.name ?? "" : "",
      numPaginas: row.page_count ?? 0,
      anexos: attachments.rows.map((item) => ({ id:item.id,nome:item.name,tamanho:`${Math.max(1,Math.round(Number(item.size_bytes)/1024))} KB`,descricao:"",confidencialidade:item.confidentiality })),
      usarCarimboAssinatura: Boolean(row.stamp_id),
    },
  });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  try {
    const form = await request.formData();
    const raw = form.get("data");
    if (typeof raw !== "string") throw new Error("Dados do rascunho em falta.");
    const input = JSON.parse(raw) as DraftInput;
    if (session.perfilNavegacao === "remetente") input.remetente = session.user.nome;
    const required = [input.tipo,input.unidadeOrigem,input.remetente,input.destinatario,input.assunto,input.prioridade,input.confidencialidade,input.prazo,input.origemDocumento];
    if (required.some((value) => !value)) throw new Error("Preencha todos os campos obrigatorios.");
    if (!isValidFutureOrTodayDate(input.prazo)) throw new Error("A data de entrega nao pode ser anterior ao dia de hoje.");
    const mainPart = form.get("mainFile");
    const mainFile = mainPart instanceof File && mainPart.size > 0 ? mainPart : null;
    const attachmentFiles = form.getAll("attachments").filter((part): part is File => part instanceof File && part.size > 0);
    if (mainFile) validateFile(mainFile);
    attachmentFiles.forEach(validateFile);
    const cleanHtml = input.origemDocumento === "sistema" ? sanitizeDocumentHtml(input.conteudo ?? "") : "";
    if (input.origemDocumento === "sistema" && !cleanHtml.replace(/<[^>]*>/g, "").trim()) throw new Error("Escreva o conteudo da carta.");

    const updated = await transaction(async (client) => {
      const found = await client.query<{id:string;protocol:string;status:string;created_by:string;origin_unit_id:string}>(
        "SELECT id,protocol,status,created_by,origin_unit_id FROM expedients WHERE id=$1 FOR UPDATE", [params.id],
      );
      const current = found.rows[0];
      if (!current) throw new Error("Rascunho nao encontrado.");
      if (current.status !== "rascunho" || (current.created_by !== session.user.id && session.perfilNavegacao !== "administracao")) throw new Error("Este rascunho ja nao pode ser editado.");
      input.unidadeOrigem = current.origin_unit_id;
      const main = (await client.query<{id:string;source:string;storage_path:string|null}>(
        "SELECT id,source,storage_path FROM documents WHERE expedient_id=$1 AND document_kind='principal' LIMIT 1", [params.id],
      )).rows[0];
      const template = input.origemDocumento === "sistema" ? await templateSnapshot(client, input.modeloId) : null;
      if (input.origemDocumento === "sistema" && !template) throw new Error("Seleccione um modelo de documento activo.");
      if (input.origemDocumento === "importado" && !mainFile && (!main || main.source === "sistema" || !main.storage_path)) throw new Error("Seleccione o documento principal.");

      let protocol = current.protocol;
      let responsible: string | null = session.user.id;
      const submitting = input.rascunho !== true;
      if (submitting) {
        const secretaryId = await resolveSecretaryId(client, input.destinatario);
        if (!secretaryId) throw new Error("Nao existe utilizador activo da Secretaria.");
        responsible = secretaryId;
        if (protocol.startsWith("RASCUNHO-")) {
          const unit = await client.query<{acronym:string}>("SELECT acronym FROM organizational_units WHERE id=$1 AND active=true", [input.unidadeOrigem]);
          if (!unit.rows[0]) throw new Error("Unidade de origem invalida.");
          const year = new Date().getFullYear();
          const sequence = await client.query<{value:number}>(`INSERT INTO number_sequences(unit_id,year,next_value) VALUES($1,$2,2) ON CONFLICT(unit_id,year) DO UPDATE SET next_value=number_sequences.next_value+1 RETURNING next_value-1 value`, [input.unidadeOrigem,year]);
          protocol = `CFM/${unit.rows[0].acronym}/${year}/${String(sequence.rows[0].value).padStart(4,"0")}`;
        }
      }
      await client.query(`UPDATE expedients SET protocol=$2,subject=$3,document_type=$4,status=$5,priority=$6,confidentiality=$7,sender_name=$8,origin_unit_id=$9,recipient_unit_id=$10,responsible_user_id=$11,origin_secretary_id=COALESCE(origin_secretary_id,$15),due_date=$12,next_step=$13,submitted_at=$14 WHERE id=$1`,
        [params.id,protocol,input.assunto.trim(),input.tipo,submitting?"submetido":"rascunho",input.prioridade,input.confidencialidade,input.remetente.trim(),input.unidadeOrigem,input.destinatario,responsible,input.prazo,submitting?"Recepcao pela Secretaria":"Continuar a edicao",submitting?new Date().toISOString():null,submitting?responsible:null]);

      let documentId: string | null = main?.id ?? null;
      if (input.origemDocumento === "apenas-processo") {
        await client.query("DELETE FROM documents WHERE expedient_id=$1 AND document_kind='principal'", [params.id]);
        documentId = null;
      } else if (input.origemDocumento === "sistema") {
        let stampId: string | null = null;
        let stampMeta: string | null = null;
        let sigMeta: string | null = null;
        if (input.usarCarimboAssinatura) {
          const resolved = await resolveMandatoryStampSignatureByUnitId(client, input.unidadeOrigem, session.user, session.perfilNavegacao);
          stampId = resolved.stamp.id;
          stampMeta = JSON.stringify(stampMetadataJson(resolved.stamp, session.user.nome, input.posicaoCarimbo));
          sigMeta = JSON.stringify(signatureMetadataJson(resolved.signature, session.user, input.posicaoAssinatura));
        }
        if (main) {
          await client.query(
            `UPDATE documents SET name=$2,source='sistema',mime_type='text/html',size_bytes=$3,page_count=1,storage_path=NULL,content_html=$4,confidentiality=$5,stamp_id=$6,signature_requested=$7,template_metadata=$8::jsonb,stamped=$7,signed=$7,stamp_metadata=$9::jsonb,signature_metadata=$10::jsonb WHERE id=$1`,
            [main.id,`${input.assunto.trim()}.html`,Buffer.byteLength(cleanHtml,"utf8"),cleanHtml,input.confidencialidade,stampId,Boolean(stampId),template ? JSON.stringify(template) : null,stampMeta,sigMeta],
          );
        } else {
          const inserted = await client.query<{ id: string }>(
            `INSERT INTO documents(expedient_id,name,document_kind,source,mime_type,size_bytes,page_count,content_html,confidentiality,created_by,stamp_id,stamped,signed,signature_requested,stamp_metadata,signature_metadata,template_metadata)
             VALUES($1,$2,'principal','sistema','text/html',$3,1,$4,$5,$6,$7,$8,$8,$8,$9::jsonb,$10::jsonb,$11::jsonb) RETURNING id`,
            [params.id,`${input.assunto.trim()}.html`,Buffer.byteLength(cleanHtml,"utf8"),cleanHtml,input.confidencialidade,session.user.id,stampId,Boolean(stampId),stampMeta,sigMeta,template ? JSON.stringify(template) : null],
          );
          documentId = inserted.rows[0].id;
        }
      } else if (mainFile) {
        const stored = await persistFile(params.id, mainFile);
        if (main) {
          await client.query(`UPDATE documents SET name=$2,source='importado',mime_type=$3,size_bytes=$4,page_count=$5,storage_path=$6,content_html=NULL,confidentiality=$7,stamp_id=NULL,signature_requested=false,template_metadata=NULL,stamped=false,signed=false,stamp_metadata=NULL,signature_metadata=NULL WHERE id=$1`, [main.id,mainFile.name,stored.mime,mainFile.size,Math.max(1,input.numPaginas??1),stored.relative,input.confidencialidade]);
        } else {
          const inserted = await client.query<{ id: string }>(`INSERT INTO documents(expedient_id,name,document_kind,source,mime_type,size_bytes,page_count,storage_path,confidentiality,created_by) VALUES($1,$2,'principal','importado',$3,$4,$5,$6,$7,$8) RETURNING id`, [params.id,mainFile.name,stored.mime,mainFile.size,Math.max(1,input.numPaginas??1),stored.relative,input.confidencialidade,session.user.id]);
          documentId = inserted.rows[0].id;
        }
      } else if (main) {
        await client.query("UPDATE documents SET confidentiality=$2 WHERE id=$1", [main.id,input.confidencialidade]);
      }

      const keptIds = (input.anexos ?? []).map((item) => item.id).filter((id) => UUID_PATTERN.test(id));
      if (keptIds.length) await client.query("DELETE FROM documents WHERE expedient_id=$1 AND document_kind='anexo' AND NOT (id=ANY($2::uuid[]))", [params.id,keptIds]);
      else await client.query("DELETE FROM documents WHERE expedient_id=$1 AND document_kind='anexo'", [params.id]);
      const newMetadata = (input.anexos ?? []).filter((item) => !UUID_PATTERN.test(item.id));
      for (let index=0; index<attachmentFiles.length; index++) {
        const file = attachmentFiles[index]; const metadata = newMetadata[index]; const stored = await persistFile(params.id,file);
        await client.query(`INSERT INTO documents(expedient_id,name,document_kind,source,mime_type,size_bytes,page_count,storage_path,confidentiality,created_by) VALUES($1,$2,'anexo','importado',$3,$4,1,$5,$6,$7)`, [params.id,file.name,stored.mime,file.size,stored.relative,metadata?.confidencialidade||input.confidencialidade,session.user.id]);
      }
      await client.query(`INSERT INTO timeline_events(expedient_id,event_type,title,description,user_id,unit_id) VALUES($1,$2,$3,$4,$5,$6)`, [params.id,submitting?"submissao":"criacao",submitting?"Rascunho submetido":"Rascunho actualizado",submitting?"Enviado para recepcao e protocolo.":"Alteracoes guardadas para continuar mais tarde.",session.user.id,session.user.unidadeId]);
      if (submitting) await client.query(`INSERT INTO notifications(user_id,notification_type,title,description,expedient_id,urgent) SELECT u.id,'tarefa','Novo expediente submetido',$2,$1,$3 FROM users u JOIN user_profiles up ON up.user_id=u.id JOIN profiles p ON p.id=up.profile_id WHERE p.slug='secretaria' AND u.status='activo'`, [params.id,`${protocol} aguarda recepcao.`,input.prioridade==="urgente"]);
      return { id: params.id, protocol, draft: !submitting, documentId };
    });
    await audit({userId:session.user.id,action:updated.draft?"Rascunho actualizado":"Rascunho submetido",entityType:"Expediente",entityId:params.id,details:{protocol:updated.protocol}});
    revalidatePath(`/expedientes/${params.id}`); revalidatePath("/expedientes");
    return NextResponse.json({ok:true,id:updated.id,protocolo:updated.protocol,rascunho:updated.draft,documentId:updated.documentId,pdfUrl:updated.documentId ? `/api/documents/${updated.documentId}/pdf` : null});
  } catch (error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Nao foi possivel guardar o rascunho."},{status:400});
  }
}
