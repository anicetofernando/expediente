import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { loadFile } from "@/lib/file-storage";
import { createDocumentPdf, type PdfReferenceMetadata, type PdfSignatureMetadata, type PdfStampMetadata } from "@/lib/document-pdf";
import { ensureDocumentReferenceMetadataColumn } from "@/lib/document-schema";
import type { DocumentTemplate, FreePosition } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface DocumentAccessRow {
  name:string; mime_type:string|null; storage_path:string|null; content_html:string|null; document_kind:string;
  stamps_metadata:PdfStampMetadata[]; signatures_metadata:PdfSignatureMetadata[];
  template_metadata:Partial<DocumentTemplate>|null; document_number:string|null; own_subject:string|null; issuing_unit_name:string|null;
  issuing_parent_unit_name:string|null; recipient_unit_name:string|null; recipient_parent_unit_name:string|null;
  decision_note:{ texto: string; autor: string; cargo?: string; data?: string; posicaoLivre?: FreePosition }|null;
  reference_metadata:PdfReferenceMetadata|null;
  protocol:string; subject:string; status:string; created_by:string; origin_unit_id:string; recipient_unit_id:string; responsible_user_id:string|null;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  await ensureDocumentReferenceMetadataColumn();
  const result = await query<DocumentAccessRow>(
    `SELECT d.name,d.mime_type,d.storage_path,d.content_html,d.document_kind,d.stamps_metadata,d.signatures_metadata,d.template_metadata,
            d.document_number,d.subject own_subject,d.decision_note,d.reference_metadata,
            issuer.name issuing_unit_name,issuer_parent.name issuing_parent_unit_name,
            recipient.name recipient_unit_name,recipient_parent.name recipient_parent_unit_name,
            e.protocol,e.subject,e.status,e.created_by,e.origin_unit_id,e.recipient_unit_id,e.responsible_user_id
       FROM documents d
       JOIN expedients e ON e.id=d.expedient_id
       JOIN users creator ON creator.id=d.created_by
       JOIN organizational_units issuer ON issuer.id=creator.unit_id
       LEFT JOIN organizational_units issuer_parent ON issuer_parent.id=issuer.parent_id
       LEFT JOIN organizational_units recipient ON recipient.id=COALESCE(d.created_for_unit_id,e.recipient_unit_id)
       LEFT JOIN organizational_units recipient_parent ON recipient_parent.id=recipient.parent_id
      WHERE d.id=$1`,
    [params.id],
  );
  const doc = result.rows[0];
  if (!doc) return NextResponse.json({ error: "Documento nao encontrado." }, { status: 404 });
  const allowed = session.perfilNavegacao === "administracao" || (session.perfilNavegacao === "secretaria" && doc.status !== "rascunho") || doc.created_by === session.user.id || doc.responsible_user_id === session.user.id || (session.perfilNavegacao === "superior" && (doc.origin_unit_id === session.user.unidadeId || doc.recipient_unit_id === session.user.unidadeId));
  if (!allowed) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  try {
    const sourceFile = doc.storage_path ? await loadFile(doc.storage_path) : null;
    const config = await query<{ setting_value: { institutionName?: string } | null }>("SELECT setting_value FROM system_settings WHERE setting_key='general-configuration'");
    const institutionName = config.rows[0]?.setting_value?.institutionName || undefined;
    // O logotipo/cabecalho/rodape institucionais sao sempre os actuais, nunca uma
    // "fotografia" antiga -- ao contrario do carimbo/assinatura (que tem de ficar
    // fiel a quem assinou nessa altura), a identidade visual da CFM e' uma so e
    // deve reflectir-se em todos os documentos, mesmo os gerados antes de uma
    // actualizacao do modelo.
    const catalogs = await query<{ setting_value: { documentTemplates?: Partial<DocumentTemplate>[] } | null }>("SELECT setting_value FROM system_settings WHERE setting_key='catalogs'");
    const templates = catalogs.rows[0]?.setting_value?.documentTemplates ?? [];
    const liveTemplate = templates.find((item) => item.id === doc.template_metadata?.id) ?? templates.find((item) => item.estado === "activo") ?? doc.template_metadata;
    const pdf = await createDocumentPdf({
      name: doc.name, mimeType: doc.mime_type, contentHtml: doc.content_html, sourceFile,
      protocol: doc.protocol, subject: doc.own_subject ?? doc.subject, stamps: doc.stamps_metadata ?? [], signatures: doc.signatures_metadata ?? [],
      template: liveTemplate, institutionName, watermark: doc.document_kind === "protocolo" ? "Protocolo" : undefined,
      issuingUnit: doc.issuing_unit_name ?? undefined,
      issuingParentUnit: doc.issuing_parent_unit_name,
      recipientUnit: doc.recipient_unit_name,
      recipientParentUnit: doc.recipient_parent_unit_name,
      documentNumber: doc.document_number, documentKind: doc.document_kind,
      decisionNote: doc.decision_note,
      reference: doc.reference_metadata,
    });
    const name = `${doc.name.replace(/\.[^.]+$/, "").replace(/["\r\n]/g, "")}.pdf`;
    const disposition = request.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline";
    return new NextResponse(pdf, { headers: { "content-type": "application/pdf", "content-disposition": `${disposition}; filename="${name}"`, "content-length": String(pdf.length), "cache-control": "private, no-cache" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nao foi possivel gerar o PDF." }, { status: 500 });
  }
}
