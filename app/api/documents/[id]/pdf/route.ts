import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { loadFile } from "@/lib/file-storage";
import { createDocumentPdf, type PdfSignatureMetadata, type PdfStampMetadata } from "@/lib/document-pdf";
import type { DocumentTemplate } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface DocumentAccessRow {
  name:string; mime_type:string|null; storage_path:string|null; content_html:string|null; document_kind:string;
  stamps_metadata:PdfStampMetadata[]; signatures_metadata:PdfSignatureMetadata[];
  template_metadata:Partial<DocumentTemplate>|null;
  protocol:string; subject:string; status:string; created_by:string; origin_unit_id:string; recipient_unit_id:string; responsible_user_id:string|null;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  const result = await query<DocumentAccessRow>(`SELECT d.name,d.mime_type,d.storage_path,d.content_html,d.document_kind,d.stamps_metadata,d.signatures_metadata,d.template_metadata,e.protocol,e.subject,e.status,e.created_by,e.origin_unit_id,e.recipient_unit_id,e.responsible_user_id FROM documents d JOIN expedients e ON e.id=d.expedient_id WHERE d.id=$1`, [params.id]);
  const doc = result.rows[0];
  if (!doc) return NextResponse.json({ error: "Documento nao encontrado." }, { status: 404 });
  const allowed = session.perfilNavegacao === "administracao" || (session.perfilNavegacao === "secretaria" && doc.status !== "rascunho") || doc.created_by === session.user.id || doc.responsible_user_id === session.user.id || (session.perfilNavegacao === "superior" && (doc.origin_unit_id === session.user.unidadeId || doc.recipient_unit_id === session.user.unidadeId));
  if (!allowed) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  try {
    const sourceFile = doc.storage_path ? await loadFile(doc.storage_path) : null;
    const config = await query<{ setting_value: { institutionName?: string } | null }>("SELECT setting_value FROM system_settings WHERE setting_key='general-configuration'");
    const institutionName = config.rows[0]?.setting_value?.institutionName || undefined;
    const pdf = await createDocumentPdf({ name: doc.name, mimeType: doc.mime_type, contentHtml: doc.content_html, sourceFile, protocol: doc.protocol, subject: doc.subject, stamps: doc.stamps_metadata ?? [], signatures: doc.signatures_metadata ?? [], template: doc.template_metadata, institutionName, watermark: doc.document_kind === "protocolo" ? "Protocolo" : undefined });
    const name = `${doc.name.replace(/\.[^.]+$/, "").replace(/["\r\n]/g, "")}.pdf`;
    const disposition = request.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline";
    return new NextResponse(pdf, { headers: { "content-type": "application/pdf", "content-disposition": `${disposition}; filename="${name}"`, "content-length": String(pdf.length), "cache-control": "private, no-cache" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nao foi possivel gerar o PDF." }, { status: 500 });
  }
}
