import "server-only";
import type { AuthSession } from "@/lib/session-types";
import type { AuditEntry, Comment, Confidentiality, Expedient, ExpedientDocument, ExpedientStatus, Priority, TimelineEvent } from "@/types";
import { db, query } from "@/lib/db";
import { configuredDocumentTypes, secretaryOwnedUnitIds } from "@/lib/routing";

interface ExpedientRow {
  id: string; protocol: string; subject: string; document_type: string; description: string;
  status: ExpedientStatus; priority: Priority; confidentiality: Confidentiality;
  sender_name: string; sender_type: "interno" | "externo"; sender_contact: string | null;
  origin_unit_id: string; origin_unit_name: string; recipient_unit_id: string; recipient_unit_name: string; recipient_unit_type: string;
  responsible_user_id: string | null; responsible_name: string | null;
  creator_name: string; created_by: string; due_date: string; next_step: string; notes: string | null;
  created_at: string; updated_at: string; pending_next_status: string | null;
}

function iso(value: string | Date) {
  return new Date(value).toISOString();
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function accessClause(session: AuthSession, startIndex = 1) {
  if (session.perfilNavegacao === "administracao") {
    return { sql: "TRUE", params: [] as unknown[] };
  }
  if (session.perfilNavegacao === "secretaria") {
    // A secretaria so' ve' expedientes das unidades pelas quais e' responsavel
    // (a sua unidade ou, na ausencia de secretaria propria, o recurso ao
    // departamento central ou a' secretaria global) -- nunca todo o sistema.
    // Um rascunho ainda nao entrou no circuito institucional: permanece
    // privado para o autor ate ser submetido. "Confidencial" nunca passa pela
    // secretaria em momento algum -- nao ve mesmo que tenha sido ela a tocar
    // no processo por engano. "Restrito" tambem nao conta para o acesso
    // colectivo por unidade -- so' quem ja' interveio directamente.
    const unitIds = await secretaryOwnedUnitIds(db, session.user.id);
    return {
      sql: `(e.confidentiality <> 'confidencial' AND ((e.status <> 'rascunho' AND e.confidentiality <> 'restrito' AND (e.recipient_unit_id=ANY($${startIndex}::text[]) OR e.origin_unit_id=ANY($${startIndex}::text[]))) OR e.created_by=$${startIndex + 1} OR e.responsible_user_id=$${startIndex + 1} OR EXISTS (SELECT 1 FROM timeline_events te WHERE te.expedient_id=e.id AND te.user_id=$${startIndex + 1})))`,
      params: [unitIds, session.user.id] as unknown[],
    };
  }
  if (session.perfilNavegacao === "superior") {
    // Idem: um chefe que encaminhou para outro nivel mantem acesso ao
    // processo para acompanhar a decisao, mesmo ja' nao sendo a unidade actual.
    // "Restrito" tira o acesso colectivo por unidade -- so' quem ja'
    // interveio directamente (responsavel actual ou no historico) mantem acesso.
    // Um rascunho ainda nao entrou no circuito -- mesmo que a unidade dele seja
    // o destino escolhido, ainda nao passou pela Secretaria, por isso nao conta
    // para o acesso colectivo (so' se torna visivel ao chefe depois de protocolado).
    return { sql: `((e.confidentiality <> 'restrito' AND e.status <> 'rascunho' AND (e.origin_unit_id=$${startIndex} OR e.recipient_unit_id=$${startIndex})) OR e.responsible_user_id=$${startIndex + 1} OR e.created_by=$${startIndex + 1} OR EXISTS (SELECT 1 FROM timeline_events te WHERE te.expedient_id=e.id AND te.user_id=$${startIndex + 1}))`, params: [session.user.unidadeId, session.user.id] };
  }
  return { sql: `(e.created_by=$${startIndex} OR e.responsible_user_id=$${startIndex})`, params: [session.user.id] };
}

function baseSelect() {
  return `SELECT e.*,ou.name origin_unit_name,ru.name recipient_unit_name,ru.unit_type recipient_unit_type,
                 responsible.full_name responsible_name,creator.full_name creator_name
            FROM expedients e
            JOIN organizational_units ou ON ou.id=e.origin_unit_id
            JOIN organizational_units ru ON ru.id=e.recipient_unit_id
            JOIN users creator ON creator.id=e.created_by
       LEFT JOIN users responsible ON responsible.id=e.responsible_user_id`;
}

function mapBase(row: ExpedientRow): Expedient {
  const now = new Date();
  const due = new Date(row.due_date);
  return {
    id: row.id,
    protocolo: row.protocol,
    assunto: row.subject,
    tipo: row.document_type,
    descricao: row.description,
    estado: row.status,
    prioridade: row.priority,
    confidencialidade: row.confidentiality,
    remetente: { nome: row.sender_name, tipo: row.sender_type, unidade: row.origin_unit_name, contacto: row.sender_contact ?? undefined },
    destinatario: row.recipient_unit_name,
    destinatarioId: row.recipient_unit_id,
    destinatarioTipo: row.recipient_unit_type,
    pendingNextStatus: row.pending_next_status,
    unidadeOrigem: row.origin_unit_name,
    responsavelActual: row.responsible_name ?? "Por atribuir",
    responsavelActualId: row.responsible_user_id ?? "",
    dataEntrada: iso(row.created_at),
    prazo: iso(row.due_date),
    ultimaActualizacao: iso(row.updated_at),
    proximaEtapa: row.next_step,
    observacoes: row.notes ?? undefined,
    documentos: [], timeline: [], comentarios: [],
    exigeCarimbo: false,
    exigeAssinatura: false,
    tipoLabel: row.document_type,
    atrasado: due < now && !["arquivado","cancelado","recebimento_confirmado"].includes(row.status),
  };
}

export type ExpedientView = "all" | "mine" | "inbox" | "outbox" | "pending" | "analysis" | "returned" | "completed" | "secretary-reception" | "secretary-protocols" | "secretary-forwarding" | "secretary-deliveries" | "official-book" | "approval" | "opinions" | "approval-history";

const VIEW_FILTERS: Record<ExpedientView, string> = {
  all: "TRUE",
  mine: "(e.created_by=__USER__ OR e.responsible_user_id=__USER__)",
  inbox: "e.responsible_user_id=__USER__ AND e.status NOT IN ('rascunho','arquivado','cancelado','recebimento_confirmado')",
  // A caixa de saida do remetente mostra so o que ainda esta "em curso" (nao
  // decidido nem entregue) -- uma vez devolvido, disponibilizado ou concluido,
  // o processo passa a viver so na caixa correspondente, nunca em ambas.
  outbox: "e.origin_unit_id=__UNIT__ AND e.status IN ('submetido','recebido','protocolado','encaminhado','em_analise','aguardando_parecer','aguardando_esclarecimento','em_transito','nota_pendente','nota_cobertura','aprovado','atrasado')",
  pending: "e.status IN ('submetido','recebido','protocolado','encaminhado','em_analise','aguardando_parecer','aguardando_esclarecimento','em_transito','nota_pendente','nota_cobertura','atrasado')",
  analysis: "e.status='em_analise'",
  returned: "e.status IN ('devolvido','rejeitado')",
  // "aprovado" so passa a Concluidos depois de a Secretaria disponibilizar e o
  // remetente confirmar -- ate la mantem-se em Caixa de saida.
  completed: "e.status IN ('arquivado','recebimento_confirmado')",
  "secretary-reception": "e.status IN ('submetido','recebido','protocolado','em_transito','nota_pendente')",
  "secretary-protocols": "e.status IN ('recebido','protocolado')",
  "secretary-forwarding": "e.status='protocolado'",
  "secretary-deliveries": "e.status IN ('aprovado','rejeitado','disponivel_remetente')",
  "official-book": "e.status <> 'rascunho' AND e.status <> 'cancelado' AND e.protocol NOT LIKE 'SUBMISSAO-%' AND e.protocol NOT LIKE 'RASCUNHO-%'",
  approval: "e.status IN ('encaminhado','nota_cobertura','em_analise','atrasado')",
  opinions: "e.status='aguardando_parecer'",
  "approval-history": "e.status IN ('aprovado','rejeitado','devolvido','arquivado')",
};

export async function listExpedients(session: AuthSession, view: ExpedientView = "all") {
  const access = await accessClause(session, 1);
  const userIndex = access.params.length + 1;
  const unitIndex = userIndex + 1;
  const viewSql = VIEW_FILTERS[view].replaceAll("__USER__", `$${userIndex}`).replaceAll("__UNIT__", `$${unitIndex}`);
  const result = await query<ExpedientRow>(`${baseSelect()} WHERE ${access.sql} AND ${viewSql} AND $${userIndex}::uuid IS NOT NULL AND $${unitIndex}::text IS NOT NULL ORDER BY e.created_at DESC`, [...access.params, session.user.id, session.user.unidadeId]);
  return result.rows.map(mapBase);
}

export interface ListedDocument extends ExpedientDocument {
  protocolo: string;
  expedienteId: string;
  assunto: string;
}

export async function listDocuments(session: AuthSession): Promise<ListedDocument[]> {
  const access = await accessClause(session, 1);
  const result = await query<{
    id:string;expedient_id:string;protocol:string;subject:string;name:string;document_kind:ExpedientDocument["tipo"];
    source:ExpedientDocument["origem"];mime_type:string|null;size_bytes:string|number;page_count:number;
    confidentiality:Confidentiality;stamped:boolean;signed:boolean;version:number;created_at:string;creator_name:string;
    stamps_metadata:{id?:string;nome:string;posicao?:string;aplicadoPor?:string;aplicadoEm?:string}[];
    signatures_metadata:{id?:string;proprietario:string;cargo?:string;aplicadoPor?:string;aplicadoEm?:string}[];
  }>(`SELECT d.*,e.protocol,e.subject,u.full_name creator_name
        FROM documents d JOIN expedients e ON e.id=d.expedient_id JOIN users u ON u.id=d.created_by
       WHERE ${access.sql} ORDER BY d.created_at DESC`, access.params);
  return result.rows.map((doc) => ({
    id:doc.id,nome:doc.name,tipo:doc.document_kind,
    formato:doc.mime_type?.includes("pdf") ? "pdf" : doc.mime_type?.includes("image") ? "imagem" : "docx",
    paginas:doc.page_count,tamanho:formatSize(Number(doc.size_bytes)),criadoEm:iso(doc.created_at),criadoPor:doc.creator_name,
    confidencialidade:doc.confidentiality,carimbado:doc.stamped,assinado:doc.signed,versao:doc.version,origem:doc.source,
    mimeType:doc.mime_type??undefined,downloadUrl:`/api/documents/${doc.id}`,
    pdfUrl:`/api/documents/${doc.id}/pdf?v=${encodeURIComponent(doc.signatures_metadata.at(-1)?.aplicadoEm ?? doc.stamps_metadata.at(-1)?.aplicadoEm ?? doc.created_at)}`,
    carimbosDetalhes:doc.stamps_metadata,assinaturasDetalhes:doc.signatures_metadata,
    protocolo:doc.protocol,expedienteId:doc.expedient_id,assunto:doc.subject,
  }));
}

export interface ListedTimelineEvent extends TimelineEvent {
  protocolo: string;
  expedienteId: string;
}

export async function listTimeline(session: AuthSession): Promise<ListedTimelineEvent[]> {
  const access = await accessClause(session, 1);
  const result = await query<{id:string;event_type:TimelineEvent["tipo"];title:string;description:string;created_at:string;user_name:string|null;unit_name:string|null;protocol:string;expedient_id:string}>(
    `SELECT t.id,t.event_type,t.title,t.description,t.created_at,u.full_name user_name,ou.name unit_name,e.protocol,t.expedient_id
       FROM timeline_events t JOIN expedients e ON e.id=t.expedient_id
       LEFT JOIN users u ON u.id=t.user_id LEFT JOIN organizational_units ou ON ou.id=t.unit_id
      WHERE ${access.sql} ORDER BY t.created_at DESC LIMIT 1000`, access.params,
  );
  return result.rows.map((event) => ({ id:event.id,tipo:event.event_type,titulo:event.title,descricao:event.description,utilizador:event.user_name??"Sistema",unidade:event.unit_name??"—",data:iso(event.created_at),protocolo:event.protocol,expedienteId:event.expedient_id }));
}

export async function listReportExpedients(session: AuthSession) {
  const [expedients, events] = await Promise.all([listExpedients(session, "all"), listTimeline(session)]);
  const grouped = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const current = grouped.get(event.expedienteId) ?? [];
    current.push(event);
    grouped.set(event.expedienteId, current);
  }
  return expedients.map((expedient) => ({ ...expedient, timeline: grouped.get(expedient.id)?.sort((a,b) => new Date(a.data).getTime()-new Date(b.data).getTime()) ?? [] }));
}

interface DocumentRow {
  id: string; name: string; document_kind: ExpedientDocument["tipo"]; source: ExpedientDocument["origem"];
  mime_type: string | null; size_bytes: string | number; page_count: number; content_html: string | null;
  confidentiality: Confidentiality; stamped: boolean; signed: boolean; version: number; created_at: string; creator_name: string;
  stamp_id: string | null; signature_requested: boolean;
  stamp_metadata: Record<string, string> | null; signature_metadata: Record<string, string> | null;
  stamps_metadata: Record<string, string>[]; signatures_metadata: Record<string, string>[];
  document_number: string | null; created_for_unit_id: string | null;
}
interface TimelineRow { id: string; event_type: TimelineEvent["tipo"]; title: string; description: string; created_at: string; user_name: string | null; unit_name: string | null }
interface CommentRow { id: string; body: string; internal: boolean; created_at: string; author_name: string; job_title: string }

export async function getExpedient(session: AuthSession, id: string) {
  const access = await accessClause(session, 2);
  const base = await query<ExpedientRow>(`${baseSelect()} WHERE e.id=$1 AND ${access.sql} LIMIT 1`, [id, ...access.params]);
  const row = base.rows[0];
  if (!row) return null;
  const [documents, timeline, comments, audit] = await Promise.all([
    query<DocumentRow>(`SELECT d.*,u.full_name creator_name FROM documents d JOIN users u ON u.id=d.created_by WHERE d.expedient_id=$1 ORDER BY d.created_at`, [id]),
    query<TimelineRow>(`SELECT t.id,t.event_type,t.title,t.description,t.created_at,u.full_name user_name,ou.name unit_name FROM timeline_events t LEFT JOIN users u ON u.id=t.user_id LEFT JOIN organizational_units ou ON ou.id=t.unit_id WHERE t.expedient_id=$1 ORDER BY t.created_at`, [id]),
    query<CommentRow>(`SELECT c.id,c.body,c.internal,c.created_at,u.full_name author_name,u.job_title FROM comments c JOIN users u ON u.id=c.author_id WHERE c.expedient_id=$1 ORDER BY c.created_at`, [id]),
    query<{ id: string; created_at: string; user_name: string | null; action: string; details: Record<string, unknown>; ip: string | null; result: AuditEntry["resultado"] }>(`SELECT a.id::text,a.created_at,u.full_name user_name,a.action,a.details,a.ip::text,a.result FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id WHERE a.entity_id IN ($1,$2) ORDER BY a.created_at DESC`, [id,row.protocol]),
  ]);
  const expedient = mapBase(row);
  const docTypes = await configuredDocumentTypes(db);
  const documentType = docTypes.find((item) => item.id === row.document_type);
  expedient.exigeCarimbo = Boolean(documentType?.exigeCarimbo);
  expedient.exigeAssinatura = Boolean(documentType?.exigeAssinatura);
  expedient.tipoLabel = documentType?.nome ?? row.document_type;
  // O chefe/director so' ve' o expediente original, os seus anexos e as notas
  // do seu proprio nivel/salto -- nunca o "protocolo" (que e' sempre para quem
  // enviou aquele salto, nao para quem o recebeu) nem as notas de outra
  // unidade (internas ao nivel anterior ou seguinte da cadeia). A Secretaria
  // tambem nao guarda o "protocolo" entre os seus documentos -- essa copia e'
  // sempre para o remetente (ou para quem enviou o salto anterior), nunca
  // para quem protocolou.
  const visibleDocuments = session.perfilNavegacao === "superior"
    ? documents.rows.filter((doc) => {
        if (doc.document_kind === "protocolo") return false;
        if (doc.document_kind === "nota") return doc.created_for_unit_id === null || doc.created_for_unit_id === session.user.unidadeId;
        return true;
      })
    : session.perfilNavegacao === "secretaria"
      ? documents.rows.filter((doc) => doc.document_kind !== "protocolo")
      : documents.rows;
  expedient.documentos = visibleDocuments.map((doc) => ({
    id: doc.id, nome: doc.name, numero: doc.document_number ?? undefined, tipo: doc.document_kind, formato: doc.mime_type?.includes("pdf") ? "pdf" : doc.mime_type?.includes("image") ? "imagem" : "docx",
    paginas: doc.page_count, tamanho: formatSize(Number(doc.size_bytes)), criadoEm: iso(doc.created_at), criadoPor: doc.creator_name,
    confidencialidade: doc.confidentiality, carimbado: doc.stamped, assinado: doc.signed, versao: doc.version, origem: doc.source,
    conteudoHtml: doc.content_html ?? undefined, mimeType: doc.mime_type ?? undefined, downloadUrl: `/api/documents/${doc.id}`,
    // O parametro v muda sempre que um novo carimbo/assinatura e acrescentado (ex.: protocolar) —
    // sem isto o <iframe> do visualizador mantem o PDF antigo em cache, pois o src fica identico.
    pdfUrl: `/api/documents/${doc.id}/pdf?v=${encodeURIComponent(doc.signatures_metadata.at(-1)?.aplicadoEm ?? doc.stamps_metadata.at(-1)?.aplicadoEm ?? doc.created_at)}`,
    carimbosDetalhes: doc.stamps_metadata.map((stamp) => ({
      id: stamp.id, nome: stamp.nome ?? "Carimbo institucional",
      posicao: stamp.posicao, aplicadoPor: stamp.aplicadoPor, aplicadoEm: stamp.aplicadoEm,
    })),
    assinaturaSolicitada: doc.signature_requested,
    assinaturasDetalhes: doc.signatures_metadata.map((signature) => ({
      id: signature.id, proprietario: signature.proprietario ?? "Assinatura institucional",
      cargo: signature.cargo, aplicadoPor: signature.aplicadoPor, aplicadoEm: signature.aplicadoEm,
    })),
  }));
  expedient.timeline = timeline.rows.map((event) => ({ id:event.id,tipo:event.event_type,titulo:event.title,descricao:event.description,utilizador:event.user_name ?? "Sistema",unidade:event.unit_name ?? "—",data:iso(event.created_at) }));
  expedient.comentarios = comments.rows.map((comment): Comment => ({ id:comment.id,autor:comment.author_name,cargo:comment.job_title,data:iso(comment.created_at),texto:comment.body,interno:comment.internal }));
  const audits: AuditEntry[] = audit.rows.map((entry) => ({ id:entry.id,data:iso(entry.created_at),utilizador:entry.user_name ?? "Sistema",accao:entry.action,entidade:"Expediente",entidadeId:row.protocol,detalhes:typeof entry.details.message === "string" ? entry.details.message : JSON.stringify(entry.details),ip:entry.ip ?? "—",resultado:entry.result }));
  return { expedient, audit: audits };
}
