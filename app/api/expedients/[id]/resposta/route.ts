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
import { generateProtocolNumber } from "@/lib/numbering";
import type { FreePosition } from "@/types";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".jpg", ".jpeg", ".png"]);
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_STATUS = new Set(["aguardando_parecer", "aguardando_esclarecimento", "devolvido", "aprovado", "encaminhado"]);

/**
 * Quando o despacho responde a um pedido de parecer/esclarecimento, o processo
 * deixa de estar "a aguardar" e volta para quem o solicitou, para continuar a
 * analise -- caso contrario ficaria preso em "aguardando_parecer" para sempre,
 * mesmo depois de respondido.
 */
async function returnToRequesterIfPending(
  client: Parameters<Parameters<typeof transaction>[0]>[0],
  exp: { id: string; status: string; responsible_user_id: string | null },
) {
  if (exp.status !== "aguardando_parecer" && exp.status !== "aguardando_esclarecimento") return;
  const eventType = exp.status === "aguardando_parecer" ? "parecer" : "esclarecimento";
  const requester = await client.query<{ user_id: string | null }>(
    "SELECT user_id FROM timeline_events WHERE expedient_id=$1 AND event_type=$2 ORDER BY created_at DESC LIMIT 1",
    [exp.id, eventType],
  );
  const nextResponsible = requester.rows[0]?.user_id ?? exp.responsible_user_id;
  // Volta para "encaminhado" (nao "em_analise") para que quem solicitou continue
  // no mesmo ciclo de notas -- pode aprovar, aprovar-para-nova-nota, rejeitar,
  // encaminhar ou pedir outro parecer, exactamente como antes de ter pedido este.
  await client.query("UPDATE expedients SET status='encaminhado', responsible_user_id=$2 WHERE id=$1", [exp.id, nextResponsible]);
}

/**
 * Uma das formas de "Finalizar aprovação" e' criar aqui um despacho formal
 * (com carimbo e assinatura obrigatorios) -- assim que fica pronto, isso ja'
 * e' a propria aprovacao: fecha o ciclo exactamente como o "Aprovar" directo,
 * entregando a` secretaria de origem para disponibilizar ao remetente.
 */
async function finalizeApprovalIfEncaminhado(
  client: Parameters<Parameters<typeof transaction>[0]>[0],
  exp: { id: string; status: string; responsible_user_id: string | null; origin_secretary_id: string | null },
) {
  if (exp.status !== "encaminhado") return;
  await client.query(
    "UPDATE expedients SET status='aprovado', responsible_user_id=$2, next_step='Disponibilizacao ao remetente pela Secretaria' WHERE id=$1",
    [exp.id, exp.origin_secretary_id ?? exp.responsible_user_id],
  );
}

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
      const found = await client.query<{ id: string; protocol: string; subject: string; status: string; created_by: string; origin_unit_id: string; recipient_unit_id: string; responsible_user_id: string | null; confidentiality: string; origin_secretary_id: string | null }>(
        "SELECT id,protocol,subject,status,created_by,origin_unit_id,recipient_unit_id,responsible_user_id,confidentiality,origin_secretary_id FROM expedients WHERE id=$1 FOR UPDATE", [params.id],
      );
      const exp = found.rows[0];
      if (!exp) throw new Error("Expediente nao encontrado.");
      if (!ALLOWED_STATUS.has(exp.status)) throw new Error("Esta accao nao e valida no estado actual do expediente.");
      // Restrito/confidencial tiram o acesso colectivo por unidade -- so' quem
      // ja' e' directamente o responsavel actual mantem acesso.
      const collectiveUnitAccessAllowed = exp.confidentiality !== "confidencial" && exp.confidentiality !== "restrito";
      const hasAccess = session.perfilNavegacao === "administracao" || exp.responsible_user_id === session.user.id || (collectiveUnitAccessAllowed && (exp.origin_unit_id === session.user.unidadeId || exp.recipient_unit_id === session.user.unidadeId));
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
        await returnToRequesterIfPending(client, exp);
        await finalizeApprovalIfEncaminhado(client, exp);
        return { documentId: input.documentId, finalized: true };
      }

      const documentId = randomUUID();
      // A resposta e uma carta propria, de outro departamento -- ganha o seu proprio
      // numero de protocolo (gerado pela unidade de quem escreve), mesmo continuando
      // associada a este mesmo expediente.
      const respondingUnit = await client.query<{ acronym: string }>(
        "SELECT acronym FROM organizational_units WHERE id=$1 AND active=true", [session.user.unidadeId],
      );
      const documentNumber = respondingUnit.rows[0]
        ? await generateProtocolNumber(client, session.user.unidadeId, respondingUnit.rows[0].acronym, new Date().getFullYear())
        : null;
      let sistemaHasFreePositionImages = false;
      if (input.modo === "sistema") {
        const clean = sanitizeDocumentHtml(input.conteudo ?? "");
        const template = await templateSnapshot(client, input.modeloId);
        const resolved = await resolveMandatoryStampSignature(client, session.user, session.unitName, session.perfilNavegacao);
        sistemaHasFreePositionImages = Boolean(resolved.stamp.imagemUrl || resolved.signature.imagemUrl);
        const stampEntry = JSON.stringify(stampMetadataJson(resolved.stamp, session.user.nome));
        const signatureEntry = JSON.stringify(signatureMetadataJson(resolved.signature, session.user));
        await client.query(
          `INSERT INTO documents(id,expedient_id,name,document_kind,source,mime_type,size_bytes,page_count,content_html,confidentiality,created_by,stamp_id,stamped,signed,stamp_metadata,signature_metadata,stamps_metadata,signatures_metadata,template_metadata,document_number)
           VALUES($1,$2,$3,'resposta','sistema','text/html',$4,1,$5,'interno',$6,$7,true,true,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13)`,
          [documentId, exp.id, `Despacho - ${exp.protocol}.html`, Buffer.byteLength(clean, "utf8"), clean, session.user.id, resolved.stamp.id,
            stampEntry, signatureEntry, `[${stampEntry}]`, `[${signatureEntry}]`, template ? JSON.stringify(template) : null, documentNumber],
        );
      } else if (file) {
        const bytes = Buffer.from(await file.arrayBuffer());
        const storedName = `${randomUUID()}-${cleanName(file.name)}`;
        const relative = await saveFile("documents", `${exp.id}/${storedName}`, bytes, file.type || undefined);
        await client.query(
          `INSERT INTO documents(id,expedient_id,name,document_kind,source,mime_type,size_bytes,page_count,storage_path,confidentiality,created_by,document_number)
           VALUES($1,$2,$3,'resposta','importado',$4,$5,1,$6,'interno',$7,$8)`,
          [documentId, exp.id, file.name, file.type || "application/octet-stream", file.size, relative, session.user.id, documentNumber],
        );
      }
      // So avanca o estado aqui quando este e o unico/ultimo passo -- se ainda falta
      // posicionar carimbo/assinatura, a chamada seguinte (com documentId) e que fecha.
      if (input.modo === "importado" || !sistemaHasFreePositionImages) {
        await returnToRequesterIfPending(client, exp);
        await finalizeApprovalIfEncaminhado(client, exp);
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
