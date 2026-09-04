import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { audit, getCurrentSession } from "@/lib/auth";
import { transaction } from "@/lib/db";
import type { FreePosition } from "@/types";
import { dateValueInMaputo, isValidFutureOrTodayDate, todayInMaputo } from "@/lib/date-only";
import {
  configuredDocumentTypes,
  requiresDirectorEscalation,
  resolveSecretaryId,
  secretaryOwnedUnitIds,
} from "@/lib/routing";
import { configuredSignatures, configuredStamps, rememberSignaturePosition, rememberStampPosition } from "@/lib/document-configuration";
import { resolveUnitStamp, resolveUserSignature } from "@/lib/document-authorization";
import { signatureMetadataJson, stampMetadataJson } from "@/lib/stamping";
import { generateProtocolNumber } from "@/lib/numbering";
import { hasActionPermission } from "@/lib/permissions";

const PROFILE_ACTIONS: Record<string, Set<string>> = {
  remetente: new Set(["confirmar"]),
  secretaria: new Set(["receber_encaminhar", "devolver", "disponibilizar", "notificar"]),
  superior: new Set(["encaminhar", "parecer", "esclarecimento", "aprovar", "rejeitar", "devolver", "resposta", "retomar", "escalar"]),
  administracao: new Set([
    "submeter", "receber_encaminhar", "encaminhar", "parecer", "esclarecimento", "aprovar", "rejeitar",
    "devolver", "resposta", "disponibilizar", "confirmar", "arquivar", "retomar", "escalar", "notificar",
  ]),
};

const NEXT_STATUS: Record<string, string | undefined> = {
  submeter: "submetido",
  encaminhar: "encaminhado",
  parecer: "aguardando_parecer",
  esclarecimento: "aguardando_esclarecimento",
  aprovar: "aprovado",
  rejeitar: "rejeitado",
  devolver: "devolvido",
  resposta: "em_analise",
  disponibilizar: "disponivel_remetente",
  confirmar: "arquivado",
  arquivar: "arquivado",
  retomar: "em_analise",
  escalar: "atrasado",
  notificar: "arquivado",
};

const LABELS: Record<string, string> = {
  submeter: "Expediente submetido",
  receber_encaminhar: "Expediente recebido, protocolado e encaminhado",
  encaminhar: "Expediente encaminhado",
  parecer: "Parecer solicitado",
  esclarecimento: "Esclarecimento solicitado",
  aprovar: "Expediente aprovado",
  rejeitar: "Expediente rejeitado",
  devolver: "Devolvido para correcao",
  resposta: "Resposta registada",
  disponibilizar: "Disponibilizado ao remetente",
  confirmar: "Recebimento confirmado e expediente concluido",
  arquivar: "Expediente arquivado",
  retomar: "Tramitacao retomada",
  escalar: "Prioridade escalada",
  notificar: "Remetente notificado e expediente concluido",
};

const ALLOWED_BY_STATUS: Record<string, string[]> = {
  rascunho: ["submeter"],
  submetido: ["receber_encaminhar", "devolver"],
  // Compatibilidade com expedientes que ficaram a meio no fluxo antigo.
  recebido: ["receber_encaminhar", "devolver"],
  protocolado: ["receber_encaminhar", "devolver"],
  encaminhado: ["encaminhar", "parecer", "devolver", "aprovar"],
  em_analise: ["encaminhar", "aprovar", "rejeitar", "devolver", "parecer", "esclarecimento"],
  aguardando_parecer: ["resposta", "esclarecimento"],
  aguardando_esclarecimento: ["resposta"],
  aprovado: ["disponibilizar"],
  rejeitado: ["notificar"],
  disponivel_remetente: ["confirmar"],
  recebimento_confirmado: ["arquivar"],
  suspenso: ["retomar"],
  expirado: ["escalar", "arquivar"],
  atrasado: ["escalar", "encaminhar", "aprovar"],
};

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function permitsDocument(configured: string[], documentType: string) {
  if (configured.length === 0) return true;
  const target = normalized(documentType);
  return configured.some((value) => {
    const allowed = normalized(value);
    return allowed === "todos" || allowed === target || allowed.startsWith(target) || target.startsWith(allowed);
  });
}

async function targetResponsible(client: Parameters<Parameters<typeof transaction>[0]>[0], unitId: string) {
  const superior = await client.query<{ id: string }>(
    `SELECT u.id
       FROM users u
       JOIN user_profiles up ON up.user_id=u.id
       JOIN profiles p ON p.id=up.profile_id
      WHERE u.unit_id=$1 AND u.status='activo' AND p.slug='superior'
      ORDER BY u.full_name LIMIT 1`,
    [unitId],
  );
  if (superior.rows[0]) return superior.rows[0].id;
  const responsible = await client.query<{ id: string }>(
    `SELECT u.id
       FROM users u
      WHERE u.unit_id=$1 AND u.status='activo'
        AND NOT EXISTS (
          SELECT 1 FROM user_profiles up JOIN profiles p ON p.id=up.profile_id
           WHERE up.user_id=u.id AND p.slug='secretaria'
        )
      ORDER BY u.full_name LIMIT 1`,
    [unitId],
  );
  if (!responsible.rows[0]) throw new Error("A unidade seleccionada nao tem um responsavel activo.");
  return responsible.rows[0].id;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  let input: { action?: string; note?: string; target?: string; posicaoCarimbo?: FreePosition; posicaoAssinatura?: FreePosition };
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido invalido." }, { status: 400 });
  }

  const action = input.action ?? "";
  if (!PROFILE_ACTIONS[session.perfilNavegacao]?.has(action)) {
    return NextResponse.json({ error: "Acção não permitida para o seu perfil." }, { status: 403 });
  }
  if (!hasActionPermission(session.profile.permissoes, action)) {
    return NextResponse.json({ error: "O seu perfil nao tem permissao para esta accao." }, { status: 403 });
  }

  try {
    const changed = await transaction(async (client) => {
      const found = await client.query<{
        id: string; protocol: string; subject: string; status: string; created_by: string; origin_unit_id: string;
        recipient_unit_id: string; responsible_user_id: string | null; due_date: string | Date; document_type: string;
        origin_secretary_id: string | null;
      }>(
        "SELECT id,protocol,subject,status,created_by,origin_unit_id,recipient_unit_id,responsible_user_id,due_date,document_type,origin_secretary_id FROM expedients WHERE id=$1 FOR UPDATE",
        [params.id],
      );
      const exp = found.rows[0];
      if (!exp) throw new Error("Expediente nao encontrado.");
      if (!ALLOWED_BY_STATUS[exp.status]?.includes(action)) {
        throw new Error("Esta accao nao e valida no estado actual do expediente.");
      }

      const secretaryUnits = session.perfilNavegacao === "secretaria" ? await secretaryOwnedUnitIds(client, session.user.id) : [];
      const hasAccess = session.perfilNavegacao === "administracao"
        || (session.perfilNavegacao === "secretaria" && exp.status !== "rascunho" && (secretaryUnits.includes(exp.recipient_unit_id) || secretaryUnits.includes(exp.origin_unit_id)))
        || exp.created_by === session.user.id
        || exp.responsible_user_id === session.user.id
        || (session.perfilNavegacao === "superior" && (exp.origin_unit_id === session.user.unidadeId || exp.recipient_unit_id === session.user.unidadeId));
      if (!hasAccess) throw new Error("Sem acesso a este expediente.");

      let responsible = exp.responsible_user_id;
      let recipient = exp.recipient_unit_id;
      let protocol = exp.protocol;
      let originSecretary = exp.origin_secretary_id;
      let next = NEXT_STATUS[action];
      let nextStep = "Continuar tramitacao";

      if (action === "submeter") {
        if (!isValidFutureOrTodayDate(dateValueInMaputo(exp.due_date))) {
          throw new Error("Actualize a data de entrega: nao pode ser anterior ao dia de hoje.");
        }
        const secretaryId = await resolveSecretaryId(client, exp.recipient_unit_id);
        if (!secretaryId) throw new Error("Nao existe utilizador activo da Secretaria.");
        responsible = secretaryId;
        originSecretary = secretaryId;
        if (protocol.startsWith("RASCUNHO-")) protocol = `SUBMISSAO-${exp.id.slice(0, 8).toUpperCase()}`;
        nextStep = "Recepcao e encaminhamento pela Secretaria";
      }

      if (action === "receber_encaminhar") {
        if (!input.target) throw new Error("Seleccione a unidade de destino.");
        responsible = await targetResponsible(client, input.target);
        recipient = input.target;
        originSecretary = originSecretary ?? session.user.id;
        if (protocol.startsWith("SUBMISSAO-") || protocol.startsWith("RASCUNHO-")) {
          const unit = await client.query<{ acronym: string }>(
            "SELECT acronym FROM organizational_units WHERE id=$1 AND active=true",
            [exp.origin_unit_id],
          );
          if (!unit.rows[0]) throw new Error("Unidade de origem invalida.");
          protocol = await generateProtocolNumber(client, exp.origin_unit_id, unit.rows[0].acronym, new Date().getFullYear());
        }

        // A Secretaria NUNCA marca o documento original -- este segue, tal como o
        // remetente o carimbou, ate ao superior. O que a Secretaria carimba e assina
        // e uma copia de protocolo separada, que fica disponivel para o remetente
        // como comprovativo. E o mesmo principio de levar duas vias ao balcao: uma
        // fica com o protocolo, a outra (o original) segue o processo.
        const principal = await client.query<{
          id: string; name: string; source: string; mime_type: string | null; size_bytes: string | number; page_count: number;
          storage_path: string | null; content_html: string | null; confidentiality: string;
          stamps_metadata: Array<Record<string, unknown>> | null; signatures_metadata: Array<Record<string, unknown>> | null;
          template_metadata: Record<string, unknown> | null;
        }>(
          `SELECT id,name,source,mime_type,size_bytes,page_count,storage_path,content_html,confidentiality,stamps_metadata,signatures_metadata,template_metadata
             FROM documents WHERE expedient_id=$1 AND document_kind='principal' LIMIT 1 FOR UPDATE`,
          [exp.id],
        );
        if (principal.rows[0]) {
          const doc = principal.rows[0];
          const [stamps, signatures] = await Promise.all([configuredStamps(client), configuredSignatures(client)]);
          const stamp = resolveUnitStamp(stamps, session.user, session.unitName, session.perfilNavegacao);
          if (!stamp) throw new Error("A Secretaria ainda nao tem um carimbo institucional activo. Configure-o em Administracao > Carimbos.");
          const signature = resolveUserSignature(signatures, session.user);
          if (!signature) throw new Error("Nao tem uma assinatura individual activa. Configure-a em Administracao > Assinaturas.");
          const stampEntry = stampMetadataJson(stamp, session.user.nome, input.posicaoCarimbo ?? stamp.posicaoLivre);
          const signatureEntry = signatureMetadataJson(signature, session.user, input.posicaoAssinatura ?? signature.posicaoLivre);
          const protocolStamps = [...(doc.stamps_metadata ?? []), stampEntry];
          const protocolSignatures = [...(doc.signatures_metadata ?? []), signatureEntry];
          await client.query(
            `INSERT INTO documents(expedient_id,name,document_kind,source,mime_type,size_bytes,page_count,storage_path,content_html,confidentiality,created_by,template_metadata,stamp_id,stamped,signed,stamp_metadata,signature_metadata,stamps_metadata,signatures_metadata)
             VALUES($1,$2,'protocolo',$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,true,true,$13::jsonb,$14::jsonb,$15::jsonb,$16::jsonb)`,
            [exp.id, `Protocolo - ${doc.name}`, doc.source, doc.mime_type, doc.size_bytes, doc.page_count, doc.storage_path, doc.content_html, doc.confidentiality,
              session.user.id, doc.template_metadata ? JSON.stringify(doc.template_metadata) : null, stamp.id,
              JSON.stringify(stampEntry), JSON.stringify(signatureEntry), JSON.stringify(protocolStamps), JSON.stringify(protocolSignatures)],
          );
          if (stamp.imagemUrl && input.posicaoCarimbo) await rememberStampPosition(client, stamp.id, input.posicaoCarimbo);
          if (signature.imagemUrl && input.posicaoAssinatura) await rememberSignaturePosition(client, signature.id, input.posicaoAssinatura);
        }
        next = "encaminhado";
        nextStep = "Analise e decisao da unidade responsavel";
      }

      if (action === "encaminhar" || action === "parecer") {
        if (!input.target) throw new Error("Seleccione a unidade destinataria.");
        responsible = await targetResponsible(client, input.target);
        recipient = input.target;
        nextStep = action === "parecer" ? "Emissao de parecer" : "Analise pela unidade destinataria";
      }

      if (action === "aprovar") {
        const [docTypes, recipientUnit] = await Promise.all([
          configuredDocumentTypes(client),
          client.query<{ unit_type: string }>("SELECT unit_type FROM organizational_units WHERE id=$1", [exp.recipient_unit_id]),
        ]);
        if (session.perfilNavegacao === "superior" && requiresDirectorEscalation(recipientUnit.rows[0]?.unit_type, exp.document_type, docTypes)) {
          throw new Error("Este tipo de documento exige aprovacao da direccao. Encaminhe para a unidade superior antes de aprovar.");
        }
        const documentType = docTypes.find((item) => item.id === exp.document_type);
        if (!documentType) throw new Error("O tipo de documento deste expediente ja nao esta configurado.");
        const principal = await client.query<{
          id: string; stamps_metadata: Array<{ id?: string }> | null; signatures_metadata: Array<{ id?: string }> | null;
        }>("SELECT id,stamps_metadata,signatures_metadata FROM documents WHERE expedient_id=$1 AND document_kind='principal' LIMIT 1 FOR UPDATE", [exp.id]);
        if ((documentType.exigeCarimbo || documentType.exigeAssinatura) && !principal.rows[0]) {
          throw new Error("Este tipo de documento exige formalizacao, mas o expediente nao tem documento principal.");
        }

        if (principal.rows[0]) {
          const stampEntries = principal.rows[0].stamps_metadata ?? [];
          const signatureEntries = principal.rows[0].signatures_metadata ?? [];
          let latestStamp: Record<string, unknown> | null = null;
          let latestSignature: Record<string, unknown> | null = null;
          let stampId: string | null = null;

          if (documentType.exigeCarimbo) {
            const stamps = await configuredStamps(client);
            const stamp = resolveUnitStamp(
              stamps.filter((candidate) => permitsDocument(candidate.tiposDocumento, documentType.nome)),
              session.user,
              session.unitName,
              session.perfilNavegacao,
            );
            if (!stamp) throw new Error("A sua unidade ainda nao tem um carimbo activo. Configure-o em Administracao > Carimbos.");
            stampId = stamp.id;
            if (!stampEntries.some((entry) => entry.id === stamp.id)) {
              latestStamp = stampMetadataJson(stamp, session.user.nome, input.posicaoCarimbo ?? stamp.posicaoLivre);
              stampEntries.push(latestStamp);
              if (stamp.imagemUrl && input.posicaoCarimbo) await rememberStampPosition(client, stamp.id, input.posicaoCarimbo);
            }
          }

          if (documentType.exigeAssinatura) {
            const signatures = await configuredSignatures(client);
            const signature = resolveUserSignature(signatures, session.user);
            if (!signature) throw new Error("Nao tem uma assinatura individual activa. Configure-a em Administracao > Assinaturas.");
            const today = todayInMaputo();
            if (signature.validadeInicio > today || signature.validadeFim < today) {
              throw new Error("A sua assinatura individual esta fora do periodo de validade.");
            }
            if (!permitsDocument(signature.documentosPermitidos, documentType.nome)) {
              throw new Error(`A sua assinatura nao esta autorizada para documentos do tipo ${documentType.nome}.`);
            }
            if (!signatureEntries.some((entry) => entry.id === signature.id)) {
              latestSignature = signatureMetadataJson(signature, session.user, input.posicaoAssinatura ?? signature.posicaoLivre);
              signatureEntries.push(latestSignature);
              if (signature.imagemUrl && input.posicaoAssinatura) await rememberSignaturePosition(client, signature.id, input.posicaoAssinatura);
            }
          }

          await client.query(
            `UPDATE documents
                SET stamped=$2,signed=$3,stamp_id=COALESCE($4,stamp_id),
                    stamp_metadata=COALESCE($5::jsonb,stamp_metadata),signature_metadata=COALESCE($6::jsonb,signature_metadata),
                    stamps_metadata=$7::jsonb,signatures_metadata=$8::jsonb
              WHERE id=$1`,
            [
              principal.rows[0].id,
              stampEntries.length > 0,
              signatureEntries.length > 0,
              stampId,
              latestStamp ? JSON.stringify(latestStamp) : null,
              latestSignature ? JSON.stringify(latestSignature) : null,
              JSON.stringify(stampEntries),
              JSON.stringify(signatureEntries),
            ],
          );
        }
        responsible = exp.origin_secretary_id ?? responsible;
        nextStep = "Disponibilizacao ao remetente pela Secretaria";
      }

      if (action === "rejeitar") {
        responsible = exp.origin_secretary_id ?? responsible;
        nextStep = "Notificacao do remetente pela Secretaria";
      }
      if (action === "devolver") {
        if (!input.note?.trim()) throw new Error("Indique o motivo da devolucao.");
        responsible = exp.created_by;
        nextStep = "Correccao pelo remetente";
      }
      if (action === "disponibilizar") {
        responsible = exp.created_by;
        nextStep = "Confirmacao de recebimento pelo remetente";
      }
      if (action === "confirmar" || action === "notificar" || action === "arquivar") {
        responsible = exp.created_by;
        nextStep = "Concluido";
      }

      await client.query(
        `UPDATE expedients
            SET protocol=$2,status=COALESCE($3,status),responsible_user_id=$4,recipient_unit_id=$5,next_step=$6,
                priority=CASE WHEN $7='escalar' THEN 'urgente' ELSE priority END,
                completed_at=CASE WHEN $3='arquivado' THEN now() ELSE completed_at END,
                submitted_at=CASE WHEN $7='submeter' THEN now() ELSE submitted_at END,
                origin_secretary_id=COALESCE(origin_secretary_id,$8)
          WHERE id=$1`,
        [exp.id, protocol, next ?? null, responsible, recipient, nextStep, action, originSecretary],
      );

      if (action === "receber_encaminhar") {
        const events = [
          ["recepcao", "Recepcao registada", "A Secretaria conferiu e recebeu formalmente o expediente."],
          ["protocolo", "Protocolo oficial atribuido", `${protocol} atribuido e carimbo institucional aplicado sem duplicacao.`],
          ["encaminhamento", "Expediente encaminhado", input.note?.trim() || "Encaminhado para analise da unidade responsavel."],
        ];
        for (const [eventType, title, description] of events) {
          await client.query(
            "INSERT INTO timeline_events(expedient_id,event_type,title,description,user_id,unit_id) VALUES($1,$2,$3,$4,$5,$6)",
            [exp.id, eventType, title, description, session.user.id, session.user.unidadeId],
          );
        }
      } else {
        const eventType = action === "encaminhar" ? "encaminhamento"
          : action === "aprovar" ? "aprovacao"
            : action === "rejeitar" ? "rejeicao"
              : action === "devolver" ? "devolucao"
                : action === "disponibilizar" ? "entrega"
                  : action === "confirmar" ? "confirmacao"
                    : action === "arquivar" || action === "notificar" ? "arquivo"
                      : "comentario";
        await client.query(
          "INSERT INTO timeline_events(expedient_id,event_type,title,description,user_id,unit_id) VALUES($1,$2,$3,$4,$5,$6)",
          [exp.id, eventType, LABELS[action] ?? action, input.note?.trim() || LABELS[action] || action, session.user.id, session.user.unidadeId],
        );
      }

      const notifyIds = new Set([exp.created_by, responsible].filter((id): id is string => Boolean(id)));
      if (action === "aprovar") {
        const chain = await client.query<{ user_id: string | null }>(
          "SELECT DISTINCT user_id FROM timeline_events WHERE expedient_id=$1 AND event_type='encaminhamento'",
          [exp.id],
        );
        for (const row of chain.rows) if (row.user_id) notifyIds.add(row.user_id);
      }
      for (const userId of notifyIds) {
        if (userId === session.user.id) continue;
        await client.query(
          "INSERT INTO notifications(user_id,notification_type,title,description,expedient_id,urgent) VALUES($1,'tarefa',$2,$3,$4,$5)",
          [userId, LABELS[action] ?? "Expediente actualizado", `${protocol} - ${exp.subject}`, exp.id, action === "escalar"],
        );
      }
      return { ...exp, protocol };
    });

    await audit({
      userId: session.user.id,
      action: LABELS[action] ?? action,
      entityType: "Expediente",
      entityId: params.id,
      details: { message: input.note?.trim() || LABELS[action], protocol: changed.protocol },
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });
    for (const path of [
      `/expedientes/${params.id}`, "/expedientes", "/secretaria", "/secretaria/entregas-pendentes", "/livro", "/aprovacoes",
    ]) revalidatePath(path);
    return NextResponse.json({ ok: true, message: LABELS[action] ?? "Acção registada.", protocolo: changed.protocol });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nao foi possivel registar a acção." }, { status: 400 });
  }
}
