import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { audit, getCurrentSession } from "@/lib/auth";
import { transaction } from "@/lib/db";
import type { FreePosition } from "@/types";
import { dateValueInMaputo, isValidFutureOrTodayDate, todayInMaputo } from "@/lib/date-only";
import {
  configuredDocumentTypes,
  resolveSecretaryId,
  secretaryOwnedUnitIds,
  targetResponsible,
} from "@/lib/routing";
import { configuredSignatures, configuredStamps, rememberSignaturePosition, rememberStampPosition } from "@/lib/document-configuration";
import { resolveUnitStamp, resolveUserSignature } from "@/lib/document-authorization";
import { signatureMetadataJson, stampMetadataJson } from "@/lib/stamping";
import { generateProtocolNumber } from "@/lib/numbering";
import { hasActionPermission } from "@/lib/permissions";

const PROFILE_ACTIONS: Record<string, Set<string>> = {
  remetente: new Set(["confirmar", "resposta"]),
  secretaria: new Set(["receber_encaminhar", "devolver", "disponibilizar", "notificar"]),
  superior: new Set(["encaminhar", "parecer", "aprovar", "aprovar_nota", "rejeitar", "devolver", "resposta", "retomar", "escalar", "disponibilizar", "notificar"]),
  administracao: new Set([
    "submeter", "receber_encaminhar", "encaminhar", "parecer", "aprovar", "aprovar_nota", "rejeitar",
    "devolver", "resposta", "disponibilizar", "confirmar", "arquivar", "retomar", "escalar", "notificar",
  ]),
};

const NEXT_STATUS: Record<string, string | undefined> = {
  submeter: "submetido",
  encaminhar: "encaminhado",
  parecer: "aguardando_parecer",
  esclarecimento: "aguardando_esclarecimento",
  aprovar: "aprovado",
  aprovar_nota: "nota_pendente",
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
  receber_encaminhar: "Expediente recebido e protocolado -- nota de encaminhamento por preparar",
  encaminhar: "Expediente encaminhado",
  parecer: "Parecer solicitado",
  esclarecimento: "Esclarecimento solicitado",
  aprovar: "Expediente aprovado",
  aprovar_nota: "Nota de cobertura pedida -- Secretaria vai prepara-la",
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
  // So' Aprovar (finalizar directamente OU emitir nota de cobertura) -- nao ha'
  // Encaminhar/Solicitar parecer directo a partir daqui.
  encaminhado: ["devolver", "aprovar", "aprovar_nota", "rejeitar"],
  // So' depois de emitida e assinada a nota de cobertura (pelo chefe, nao pela
  // Secretaria) e' que se pode subir de nivel ou pedir parecer a outra unidade.
  nota_cobertura: ["encaminhar", "parecer"],
  em_analise: ["encaminhar", "aprovar", "rejeitar", "devolver", "parecer"],
  aguardando_parecer: ["resposta"],
  aguardando_esclarecimento: ["resposta"],
  // A caminho da secretaria da unidade seguinte (subida a director, ou pedido
  // de parecer a outra unidade) -- so ela pode receber, protocolar e preparar
  // a nota antes de chegar a pessoa responsavel.
  em_transito: ["receber_encaminhar"],
  // A correccao de um devolvido passa sempre pelo assistente de edicao
  // (/api/expedients/[id]/draft), nunca por um "Responder" generico aqui.
  devolvido: [],
  aprovado: ["disponibilizar"],
  rejeitado: ["notificar"],
  disponivel_remetente: ["confirmar"],
  recebimento_confirmado: ["arquivar"],
  suspenso: ["retomar"],
  expirado: ["escalar", "arquivar"],
  atrasado: ["escalar", "encaminhar", "aprovar"],
};

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  let input: { action?: string; note?: string; target?: string; posicaoCarimbo?: FreePosition; posicaoAssinatura?: FreePosition; posicaoNota?: FreePosition; alvo?: string };
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
        origin_secretary_id: string | null; confidentiality: string; pending_next_status: string | null;
      }>(
        "SELECT id,protocol,subject,status,created_by,origin_unit_id,recipient_unit_id,responsible_user_id,due_date,document_type,origin_secretary_id,confidentiality,pending_next_status FROM expedients WHERE id=$1 FOR UPDATE",
        [params.id],
      );
      const exp = found.rows[0];
      if (!exp) throw new Error("Expediente nao encontrado.");
      if (!ALLOWED_BY_STATUS[exp.status]?.includes(action)) {
        throw new Error("Esta accao nao e valida no estado actual do expediente.");
      }
      // "Disponibilizar" e "notificar" sao normalmente so' da Secretaria --
      // excepto quando o processo e' confidencial, caso em que ela nunca chega
      // a ve-lo, por isso e' o proprio responsavel (superior) que o faz directamente.
      if ((action === "disponibilizar" || action === "notificar") && session.perfilNavegacao === "superior" && exp.confidentiality !== "confidencial") {
        throw new Error("So a Secretaria pode concluir esta etapa.");
      }
      // A partir do momento em que a Secretaria encaminha para o superior, deixa de
      // poder devolver por iniciativa propria -- so o superior, ja com o processo em
      // maos, pode decidir devolve-lo. Antes de encaminhar (submetido/recebido/
      // protocolado), a devolucao continua a ser accao normal da Secretaria.
      if (action === "devolver" && (exp.status === "encaminhado" || exp.status === "em_analise") && session.perfilNavegacao === "secretaria") {
        throw new Error("O processo ja foi encaminhado -- so o superior pode devolve-lo a partir daqui.");
      }
      // Enquanto se aguarda parecer/esclarecimento, so quem recebeu o pedido
      // (o responsavel actual) pode responder -- nao quem o solicitou.
      if (
        (action === "resposta" || action === "esclarecimento") &&
        (exp.status === "aguardando_parecer" || exp.status === "aguardando_esclarecimento") &&
        session.perfilNavegacao !== "administracao" &&
        exp.responsible_user_id !== session.user.id
      ) {
        throw new Error("Este pedido ainda nao lhe foi atribuido -- aguarde que o responsavel actual responda.");
      }

      const secretaryUnits = session.perfilNavegacao === "secretaria" ? await secretaryOwnedUnitIds(client, session.user.id) : [];
      // Confidencial nunca fica acessivel a Secretaria por acesso colectivo de
      // unidade -- so' quem e' directamente o criador ou o responsavel actual
      // (o que, por definicao, nunca e' a Secretaria num confidencial). Restrito
      // tambem tira o acesso colectivo de unidade (secretaria e superior),
      // deixando so' quem ja' interveio directamente.
      const collectiveUnitAccessAllowed = exp.confidentiality !== "confidencial" && exp.confidentiality !== "restrito";
      const hasAccess = session.perfilNavegacao === "administracao"
        || (session.perfilNavegacao === "secretaria" && collectiveUnitAccessAllowed && exp.status !== "rascunho" && (secretaryUnits.includes(exp.recipient_unit_id) || secretaryUnits.includes(exp.origin_unit_id)))
        || exp.created_by === session.user.id
        || exp.responsible_user_id === session.user.id
        || (session.perfilNavegacao === "superior" && collectiveUnitAccessAllowed && (exp.origin_unit_id === session.user.unidadeId || exp.recipient_unit_id === session.user.unidadeId));
      if (!hasAccess) throw new Error("Sem acesso a este expediente.");

      let responsible = exp.responsible_user_id;
      let recipient = exp.recipient_unit_id;
      let protocol = exp.protocol;
      let originSecretary = exp.origin_secretary_id;
      let next = NEXT_STATUS[action];
      let nextStep = "Continuar tramitacao";
      // Enquanto o processo esta "nota_pendente"/"em_transito", guarda para
      // onde deve ir assim que a Secretaria concluir o passo dela (a nota, ou
      // o receber+protocolar) -- consumido em /api/expedients/[id]/nota ou no
      // proprio receber_encaminhar seguinte. Limpo por omissao; cada bloco que
      // precisa define o valor.
      let pendingNextStatus: string | null = null;

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
        const isFirstHop = exp.status !== "em_transito";

        if (isFirstHop) {
          if (!input.target) throw new Error("Seleccione a unidade de destino.");
          // O remetente ja escolheu o destino ao criar o expediente. Se escolheu um
          // servico especifico, a Secretaria nao tem escolha -- so pode confirmar
          // esse mesmo servico. Se escolheu apenas o departamento/direccao, a
          // Secretaria so pode escolher entre os servicos daquele departamento.
          const originalTarget = await client.query<{ unit_type: string }>(
            "SELECT unit_type FROM organizational_units WHERE id=$1 AND active=true", [exp.recipient_unit_id],
          );
          if (!originalTarget.rows[0]) throw new Error("A unidade destinataria original ja nao esta activa.");
          if (originalTarget.rows[0]?.unit_type === "direccao") {
            const validChild = await client.query<{ id: string }>(
              "SELECT id FROM organizational_units WHERE id=$1 AND parent_id=$2 AND active=true", [input.target, exp.recipient_unit_id],
            );
            if (input.target !== exp.recipient_unit_id && !validChild.rows[0]) {
              throw new Error("So pode encaminhar para um servico do departamento indicado pelo remetente.");
            }
          } else if (input.target !== exp.recipient_unit_id) {
            throw new Error("O remetente ja definiu o destino -- nao e possivel encaminhar para outra unidade.");
          }
          recipient = input.target;
        }
        // Nos saltos seguintes (em_transito), o destino ja foi fixado por quem
        // encaminhou/pediu parecer -- a Secretaria so confirma, nunca escolhe.

        originSecretary = originSecretary ?? session.user.id;
        if (isFirstHop && (protocol.startsWith("SUBMISSAO-") || protocol.startsWith("RASCUNHO-"))) {
          const unit = await client.query<{ acronym: string }>(
            "SELECT acronym FROM organizational_units WHERE id=$1 AND active=true",
            [exp.origin_unit_id],
          );
          if (!unit.rows[0]) throw new Error("Unidade de origem invalida.");
          protocol = await generateProtocolNumber(client, exp.origin_unit_id, unit.rows[0].acronym, new Date().getFullYear());
        }

        if (isFirstHop) {
          // A Secretaria NUNCA marca o documento original -- este segue, tal como o
          // remetente o carimbou, ate ao superior. O que a Secretaria carimba e assina
          // e uma copia de protocolo separada, que fica disponivel para o remetente
          // como comprovativo. E o mesmo principio de levar duas vias ao balcao: uma
          // fica com o protocolo, a outra (o original) segue o processo.
          const principal = await client.query<{
            id: string; name: string; source: string; mime_type: string | null; size_bytes: string | number; page_count: number;
            storage_path: string | null; content_html: string | null; confidentiality: string;
            stamps_metadata: Array<Record<string, unknown>> | null; signatures_metadata: Array<Record<string, unknown>> | null;
            template_metadata: Record<string, unknown> | null; created_for_unit_id: string | null;
          }>(
            `SELECT id,name,source,mime_type,size_bytes,page_count,storage_path,content_html,confidentiality,stamps_metadata,signatures_metadata,template_metadata,created_for_unit_id
               FROM documents WHERE expedient_id=$1 AND document_kind='principal' LIMIT 1 FOR UPDATE`,
            [exp.id],
          );
          if (principal.rows[0]) {
            const doc = principal.rows[0];
            const [stamps, signatures] = await Promise.all([configuredStamps(client), configuredSignatures(client)]);
            const stamp = resolveUnitStamp(stamps, session.user, session.unitName, session.perfilNavegacao, "secretaria");
            if (!stamp) throw new Error("A Secretaria ainda nao tem um carimbo institucional activo. Configure-o em Administracao > Carimbos.");
            const signature = resolveUserSignature(signatures, session.user);
            if (!signature) throw new Error("Nao tem uma assinatura individual activa. Configure-a em Administracao > Assinaturas.");
            const stampEntry = stampMetadataJson(stamp, session.user.nome, input.posicaoCarimbo ?? stamp.posicaoLivre);
            const signatureEntry = signatureMetadataJson(signature, session.user, input.posicaoAssinatura ?? signature.posicaoLivre);
            const protocolStamps = [...(doc.stamps_metadata ?? []), stampEntry];
            const protocolSignatures = [...(doc.signatures_metadata ?? []), signatureEntry];
            await client.query(
              `INSERT INTO documents(expedient_id,name,document_kind,source,mime_type,size_bytes,page_count,storage_path,content_html,confidentiality,created_by,template_metadata,stamp_id,stamped,signed,stamp_metadata,signature_metadata,stamps_metadata,signatures_metadata,created_for_unit_id)
               VALUES($1,$2,'protocolo',$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,true,true,$13::jsonb,$14::jsonb,$15::jsonb,$16::jsonb,$17)`,
              [exp.id, `Protocolo - ${doc.name}`, doc.source, doc.mime_type, doc.size_bytes, doc.page_count, doc.storage_path, doc.content_html, doc.confidentiality,
                session.user.id, doc.template_metadata ? JSON.stringify(doc.template_metadata) : null, stamp.id,
                JSON.stringify(stampEntry), JSON.stringify(signatureEntry), JSON.stringify(protocolStamps), JSON.stringify(protocolSignatures), doc.created_for_unit_id ?? exp.recipient_unit_id],
            );
            if (stamp.imagemUrl && input.posicaoCarimbo) await rememberStampPosition(client, stamp.id, input.posicaoCarimbo);
            if (signature.imagemUrl && input.posicaoAssinatura) await rememberSignaturePosition(client, signature.id, input.posicaoAssinatura);
          }
        }
        // Nos saltos seguintes, o "protocolo" desta etapa e' o proprio numero
        // atribuido a nota que a Secretaria vai criar a seguir (mesmo mecanismo
        // do despacho) -- nao duplica outra copia de protocolo aqui.

        // A Secretaria recebeu e protocolou -- agora tem de preparar a nota
        // antes de entregar a pessoa responsavel (accao seguinte, dedicada).
        responsible = session.user.id;
        next = "nota_pendente";
        pendingNextStatus = isFirstHop ? "encaminhado" : (exp.pending_next_status ?? "encaminhado");
        nextStep = "Secretaria a preparar a nota de encaminhamento";
      }

      if (action === "encaminhar" || action === "parecer") {
        if (!input.target) throw new Error("Seleccione a unidade destinataria.");
        const targetUnit = await client.query<{ id: string }>("SELECT id FROM organizational_units WHERE id=$1 AND active=true", [input.target]);
        if (!targetUnit.rows[0]) throw new Error("Seleccione uma unidade destinataria activa.");
        // So' se chega aqui a partir de "nota_cobertura" (nota de cobertura ja'
        // emitida) -- o salto passa sempre primeiro pela Secretaria da unidade
        // destino, que protocola e prepara a proxima nota antes de chegar a
        // pessoa responsavel. Vindo de "em_analise" (fluxo mais antigo,
        // achatado) mantem-se o comportamento directo de sempre, sem tocar nisso.
        const viaNota = exp.status === "encaminhado" || exp.status === "nota_cobertura";

        if (viaNota) {
          const secretaryId = await resolveSecretaryId(client, input.target);
          if (!secretaryId) throw new Error("Nao existe utilizador activo da Secretaria para a unidade seleccionada.");
          responsible = secretaryId;
          recipient = input.target;
          next = "em_transito";
          pendingNextStatus = action === "parecer" ? "aguardando_parecer" : "encaminhado";
          nextStep = action === "parecer"
            ? "Protocolo e nota pela Secretaria da unidade consultada"
            : "Protocolo e nota pela Secretaria da unidade seguinte";

          // O chefe/director carimba e assina a NOTA actual antes de ela seguir
          // (nao ha' "tomei conhecimento" no principal aqui -- quem circula agora
          // e' a nota, nao o documento original).
          const latestNota = await client.query<{
            id: string; stamps_metadata: Array<Record<string, unknown> & { id?: string }> | null; signatures_metadata: Array<Record<string, unknown> & { id?: string }> | null;
          }>(
            "SELECT id,stamps_metadata,signatures_metadata FROM documents WHERE expedient_id=$1 AND document_kind='nota' ORDER BY created_at DESC LIMIT 1 FOR UPDATE",
            [exp.id],
          );
          if (!latestNota.rows[0]) throw new Error("Nao existe nota de cobertura para assinar antes de encaminhar.");
          if (latestNota.rows[0]) {
            const [stamps, signatures] = await Promise.all([configuredStamps(client), configuredSignatures(client)]);
            const stamp = resolveUnitStamp(stamps, session.user, session.unitName, session.perfilNavegacao, "aprovacao");
            if (!stamp) throw new Error("A sua unidade ainda nao tem um carimbo activo. Configure-o em Administracao > Carimbos antes de encaminhar.");
            const signature = resolveUserSignature(signatures, session.user);
            if (!signature) throw new Error("Nao tem uma assinatura individual activa. Configure-a em Administracao > Assinaturas antes de encaminhar.");

            const signatureEntries = latestNota.rows[0].signatures_metadata ?? [];
            const stampEntries = latestNota.rows[0].stamps_metadata ?? [];
            const signatureEntry = signatureMetadataJson(signature, session.user, input.posicaoAssinatura ?? signature.posicaoLivre);
            const stampEntry = stampMetadataJson(stamp, session.user.nome, input.posicaoCarimbo ?? stamp.posicaoLivre);
            signatureEntries.push(signatureEntry);
            stampEntries.push(stampEntry);
            await client.query(
              `UPDATE documents
                  SET signed=true,stamped=true,
                      signature_metadata=$2::jsonb,signatures_metadata=$3::jsonb,
                      stamp_id=$4,stamp_metadata=$5::jsonb,stamps_metadata=$6::jsonb
                WHERE id=$1`,
              [latestNota.rows[0].id, JSON.stringify(signatureEntry), JSON.stringify(signatureEntries), stamp.id, JSON.stringify(stampEntry), JSON.stringify(stampEntries)],
            );
            if (stamp.imagemUrl && input.posicaoCarimbo) await rememberStampPosition(client, stamp.id, input.posicaoCarimbo);
            if (signature.imagemUrl && input.posicaoAssinatura) await rememberSignaturePosition(client, signature.id, input.posicaoAssinatura);
          }
        } else {
          responsible = await targetResponsible(client, input.target);
          recipient = input.target;
          nextStep = action === "parecer" ? "Emissao de parecer" : "Analise pela unidade destinataria";

          if (action === "encaminhar") {
            // "Tomei conhecimento": ao encaminhar (repassa a responsabilidade, nao volta
            // para decidir -- ao contrario de "parecer"), a assinatura pessoal de quem
            // encaminha fica registada no documento original, somando-se as anteriores.
            const principal = await client.query<{ id: string; signatures_metadata: Array<{ id?: string }> | null }>(
              "SELECT id,signatures_metadata FROM documents WHERE expedient_id=$1 AND document_kind='principal' LIMIT 1 FOR UPDATE",
              [exp.id],
            );
            if (principal.rows[0]) {
              const signatures = await configuredSignatures(client);
              const signature = resolveUserSignature(signatures, session.user);
              if (!signature) throw new Error("Nao tem uma assinatura individual activa. Configure-a em Administracao > Assinaturas antes de encaminhar.");
              const signatureEntries = principal.rows[0].signatures_metadata ?? [];
              if (!signatureEntries.some((entry) => entry.id === signature.id)) {
                const entry = signatureMetadataJson(signature, session.user, signature.posicaoLivre);
                signatureEntries.push(entry);
                await client.query(
                  `UPDATE documents SET signed=true,signature_metadata=$2::jsonb,signatures_metadata=$3::jsonb WHERE id=$1`,
                  [principal.rows[0].id, JSON.stringify(entry), JSON.stringify(signatureEntries)],
                );
              }
            }
          }
        }
      }

      if (action === "esclarecimento") {
        // Ao contrario do parecer (que vai para outra unidade, via secretaria),
        // o esclarecimento e' sempre um vai-e-vem directo entre quem pediu e o
        // proprio remetente -- passa a responsabilidade directamente para ele.
        responsible = exp.created_by;
        nextStep = "Esclarecimento a prestar pelo remetente";
      }

      if (action === "aprovar_nota") {
        // A Secretaria nunca assina nem carimba nenhuma nota -- so' protocola e
        // transmite. Ao "aprovar para nova nota", e' o proprio chefe/director
        // que carimba e assina a nota ACTUAL (a que tem em maos agora), antes
        // de pedir a Secretaria para preparar a proxima (em branco, "nota de
        // cobertura") -- so' mais tarde, ao encaminhar ou pedir parecer, e' que
        // ele volta a carimbar/assinar essa nota seguinte.
        const latestNota = await client.query<{
          id: string; stamps_metadata: Array<{ id?: string }> | null; signatures_metadata: Array<{ id?: string }> | null;
        }>(
          "SELECT id,stamps_metadata,signatures_metadata FROM documents WHERE expedient_id=$1 AND document_kind='nota' ORDER BY created_at DESC LIMIT 1 FOR UPDATE",
          [exp.id],
        );
        if (latestNota.rows[0]) {
          const signatures = await configuredSignatures(client);
          const signature = resolveUserSignature(signatures, session.user);
          if (!signature) throw new Error("Nao tem uma assinatura individual activa. Configure-a em Administracao > Assinaturas.");
          const signatureEntries = latestNota.rows[0].signatures_metadata ?? [];
          if (!signatureEntries.some((entry) => entry.id === signature.id)) {
            const entry = signatureMetadataJson(signature, session.user, signature.posicaoLivre);
            signatureEntries.push(entry);
            await client.query(
              `UPDATE documents SET signed=true,signature_metadata=$2::jsonb,signatures_metadata=$3::jsonb WHERE id=$1`,
              [latestNota.rows[0].id, JSON.stringify(entry), JSON.stringify(signatureEntries)],
            );
          }
          const stamps = await configuredStamps(client);
          const stamp = resolveUnitStamp(stamps, session.user, session.unitName, session.perfilNavegacao, "aprovacao");
          const stampEntries = latestNota.rows[0].stamps_metadata ?? [];
          if (stamp && !stampEntries.some((entry) => entry.id === stamp.id)) {
            const entry = stampMetadataJson(stamp, session.user.nome, stamp.posicaoLivre);
            stampEntries.push(entry);
            await client.query(
              `UPDATE documents SET stamped=true,stamp_metadata=$2::jsonb,stamps_metadata=$3::jsonb WHERE id=$1`,
              [latestNota.rows[0].id, JSON.stringify(entry), JSON.stringify(stampEntries)],
            );
          }
        }
        const secretaryId = await resolveSecretaryId(client, exp.recipient_unit_id);
        if (!secretaryId) throw new Error("Nao existe utilizador activo da Secretaria para preparar a nota de cobertura.");
        responsible = secretaryId;
        pendingNextStatus = "nota_cobertura";
        nextStep = "Secretaria a preparar a nota de cobertura";
      }

      if (action === "resposta" && exp.status === "devolvido") {
        // A resposta do remetente a uma devolucao volta para quem devolveu -- nunca
        // cria um processo novo, continua no mesmo expediente.
        const lastHandler = await client.query<{ user_id: string | null }>(
          "SELECT user_id FROM timeline_events WHERE expedient_id=$1 AND event_type IN ('devolucao','encaminhamento') ORDER BY created_at DESC LIMIT 1",
          [exp.id],
        );
        if (lastHandler.rows[0]?.user_id) responsible = lastHandler.rows[0].user_id;
      }
      if (action === "resposta" && (exp.status === "aguardando_parecer" || exp.status === "aguardando_esclarecimento")) {
        // A resposta a um parecer/esclarecimento volta directamente para quem o
        // pediu -- nao fica com quem respondeu.
        const eventType = exp.status === "aguardando_parecer" ? "parecer" : "esclarecimento";
        const requester = await client.query<{ user_id: string | null }>(
          "SELECT user_id FROM timeline_events WHERE expedient_id=$1 AND event_type=$2 ORDER BY created_at DESC LIMIT 1",
          [exp.id, eventType],
        );
        if (requester.rows[0]?.user_id) responsible = requester.rows[0].user_id;
        // Volta para "encaminhado" (nao "em_analise") para que quem solicitou
        // continue no mesmo ciclo de notas -- exactamente como o despacho de
        // parecer (rota dedicada /resposta) ja faz.
        next = "encaminhado";
      }

      if (action === "aprovar") {
        if (!input.note?.trim()) throw new Error("Escreva o texto de aprovacao (ex.: \"Autorizo\").");
        // O chefe de servico e o director tem exactamente a mesma capacidade de
        // aprovar directamente, seja qual for o tipo de documento -- nao ha
        // nenhuma obrigatoriedade de escalar ao director primeiro. A unica forma
        // de o director intervir e' o proprio chefe escolher subir (Aprovar >
        // Emitir nota de cobertura > Encaminhar), nunca uma imposicao do sistema.
        const docTypes = await configuredDocumentTypes(client);
        const documentType = docTypes.find((item) => item.id === exp.document_type);
        if (!documentType) throw new Error("O tipo de documento deste expediente ja nao esta configurado.");
        // O chefe/director escolhe onde assina a aprovacao: na nota actual (se
        // ja' houver alguma, do ciclo de notas) ou directamente no expediente
        // original -- em ambos os casos e' uma marca directa, sem gerar um
        // documento novo.
        const alvoNota = input.alvo === "nota";
        const targetDoc = alvoNota
          ? await client.query<{
              id: string; stamps_metadata: Array<{ id?: string }> | null; signatures_metadata: Array<{ id?: string }> | null;
            }>("SELECT id,stamps_metadata,signatures_metadata FROM documents WHERE expedient_id=$1 AND document_kind='nota' ORDER BY created_at DESC LIMIT 1 FOR UPDATE", [exp.id])
          : await client.query<{
              id: string; stamps_metadata: Array<{ id?: string }> | null; signatures_metadata: Array<{ id?: string }> | null;
            }>("SELECT id,stamps_metadata,signatures_metadata FROM documents WHERE expedient_id=$1 AND document_kind='principal' LIMIT 1 FOR UPDATE", [exp.id]);
        if (alvoNota && !targetDoc.rows[0]) throw new Error("Nao existe nenhuma nota activa para assinar a aprovacao.");
        if (!alvoNota && !targetDoc.rows[0]) {
          throw new Error("O expediente nao tem documento principal.");
        }

        if (targetDoc.rows[0]) {
          const stampEntries = targetDoc.rows[0].stamps_metadata ?? [];
          const signatureEntries = targetDoc.rows[0].signatures_metadata ?? [];
          let latestStamp: Record<string, unknown> | null = null;
          let latestSignature: Record<string, unknown> | null = null;
          let stampId: string | null = null;

          // A marca de aprovacao (na nota ou no expediente) leva sempre carimbo E
          // assinatura -- independentemente do que o tipo de documento exige ou
          // permite -- tal como o despacho formal e a submissao original do
          // remetente. O chefe/director que tem carimbo/assinatura activos tem de
          // conseguir sempre aprovar, sem restricoes por tipo de documento.
          {
            const stamps = await configuredStamps(client);
            const stamp = resolveUnitStamp(stamps, session.user, session.unitName, session.perfilNavegacao, "aprovacao");
            if (!stamp) throw new Error("A sua unidade ainda nao tem um carimbo activo. Configure-o em Administracao > Carimbos.");
            stampId = stamp.id;
            latestStamp = stampMetadataJson(stamp, session.user.nome, input.posicaoCarimbo ?? stamp.posicaoLivre);
            stampEntries.push(latestStamp);
            if (stamp.imagemUrl && input.posicaoCarimbo) await rememberStampPosition(client, stamp.id, input.posicaoCarimbo);
          }

          {
            const signatures = await configuredSignatures(client);
            const signature = resolveUserSignature(signatures, session.user);
            if (!signature) throw new Error("Nao tem uma assinatura individual activa. Configure-a em Administracao > Assinaturas.");
            const today = todayInMaputo();
            if (signature.validadeInicio > today || signature.validadeFim < today) {
              throw new Error("A sua assinatura individual esta fora do periodo de validade.");
            }
            latestSignature = signatureMetadataJson(signature, session.user, input.posicaoAssinatura ?? signature.posicaoLivre);
            signatureEntries.push(latestSignature);
            if (signature.imagemUrl && input.posicaoAssinatura) await rememberSignaturePosition(client, signature.id, input.posicaoAssinatura);
          }

          // O texto de aprovacao escrito pelo proprio chefe/director ("Autorizo",
          // etc.) fica visivel dentro do documento, junto ao carimbo/assinatura --
          // nao so' no historico -- para ficar claro quem decidiu e porque.
          const decisionNote = JSON.stringify({
            texto: input.note!.trim(), autor: session.user.nome, cargo: session.user.cargo || undefined,
            data: todayInMaputo(),
            posicaoLivre: input.posicaoNota,
          });
          await client.query(
            `UPDATE documents
                SET stamped=$2,signed=$3,stamp_id=COALESCE($4,stamp_id),
                    stamp_metadata=COALESCE($5::jsonb,stamp_metadata),signature_metadata=COALESCE($6::jsonb,signature_metadata),
                    stamps_metadata=$7::jsonb,signatures_metadata=$8::jsonb,decision_note=$9::jsonb
              WHERE id=$1`,
            [
              targetDoc.rows[0].id,
              stampEntries.length > 0,
              signatureEntries.length > 0,
              stampId,
              latestStamp ? JSON.stringify(latestStamp) : null,
              latestSignature ? JSON.stringify(latestSignature) : null,
              JSON.stringify(stampEntries),
              JSON.stringify(signatureEntries),
              decisionNote,
            ],
          );
        }
        responsible = exp.origin_secretary_id ?? responsible;
        nextStep = "Disponibilizacao ao remetente pela Secretaria";
      }

      if (action === "rejeitar") {
        if (!input.note?.trim()) throw new Error("Indique o motivo da rejeicao.");
        // Tal como o Aprovar, a rejeicao marca-se directamente na nota actual ou
        // no expediente original -- sempre com carimbo e assinatura de quem
        // rejeita, para ficar claro quem tomou a decisao.
        if (input.alvo === "nota" || input.alvo === "expediente") {
          const alvoNota = input.alvo === "nota";
          const targetDoc = alvoNota
            ? await client.query<{
                id: string; stamps_metadata: Array<{ id?: string }> | null; signatures_metadata: Array<{ id?: string }> | null;
              }>("SELECT id,stamps_metadata,signatures_metadata FROM documents WHERE expedient_id=$1 AND document_kind='nota' ORDER BY created_at DESC LIMIT 1 FOR UPDATE", [exp.id])
            : await client.query<{
                id: string; stamps_metadata: Array<{ id?: string }> | null; signatures_metadata: Array<{ id?: string }> | null;
              }>("SELECT id,stamps_metadata,signatures_metadata FROM documents WHERE expedient_id=$1 AND document_kind='principal' LIMIT 1 FOR UPDATE", [exp.id]);
          if (!targetDoc.rows[0]) throw new Error(alvoNota ? "Nao existe nenhuma nota activa para marcar a rejeicao." : "O expediente nao tem documento principal.");
          const stampEntries = targetDoc.rows[0].stamps_metadata ?? [];
          const signatureEntries = targetDoc.rows[0].signatures_metadata ?? [];
          let latestStamp: Record<string, unknown> | null = null;
          let latestSignature: Record<string, unknown> | null = null;
          let stampId: string | null = null;
          {
            const stamps = await configuredStamps(client);
            const stamp = resolveUnitStamp(stamps, session.user, session.unitName, session.perfilNavegacao, "aprovacao");
            if (!stamp) throw new Error("A sua unidade ainda nao tem um carimbo activo. Configure-o em Administracao > Carimbos.");
            stampId = stamp.id;
            latestStamp = stampMetadataJson(stamp, session.user.nome, input.posicaoCarimbo ?? stamp.posicaoLivre);
            stampEntries.push(latestStamp);
            if (stamp.imagemUrl && input.posicaoCarimbo) await rememberStampPosition(client, stamp.id, input.posicaoCarimbo);
          }
          {
            const signatures = await configuredSignatures(client);
            const signature = resolveUserSignature(signatures, session.user);
            if (!signature) throw new Error("Nao tem uma assinatura individual activa. Configure-a em Administracao > Assinaturas.");
            latestSignature = signatureMetadataJson(signature, session.user, input.posicaoAssinatura ?? signature.posicaoLivre);
            signatureEntries.push(latestSignature);
            if (signature.imagemUrl && input.posicaoAssinatura) await rememberSignaturePosition(client, signature.id, input.posicaoAssinatura);
          }
          // O motivo da rejeicao, escrito pelo proprio chefe/director, fica
          // visivel dentro do documento, junto ao carimbo/assinatura -- tal como
          // o texto de aprovacao.
          const decisionNote = JSON.stringify({
            texto: input.note!.trim(), autor: session.user.nome, cargo: session.user.cargo || undefined,
            data: todayInMaputo(),
            posicaoLivre: input.posicaoNota,
          });
          await client.query(
            `UPDATE documents SET stamped=$2,signed=$3,stamp_id=COALESCE($4,stamp_id),stamp_metadata=COALESCE($5::jsonb,stamp_metadata),signature_metadata=COALESCE($6::jsonb,signature_metadata),stamps_metadata=$7::jsonb,signatures_metadata=$8::jsonb,decision_note=$9::jsonb WHERE id=$1`,
            [targetDoc.rows[0].id, stampEntries.length > 0, signatureEntries.length > 0, stampId, latestStamp ? JSON.stringify(latestStamp) : null, latestSignature ? JSON.stringify(latestSignature) : null, JSON.stringify(stampEntries), JSON.stringify(signatureEntries), decisionNote],
          );
        }
        responsible = exp.origin_secretary_id ?? responsible;
        nextStep = "Notificacao do remetente pela Secretaria";
      }
      if (action === "devolver") {
        if (!input.note?.trim()) throw new Error("Indique o motivo da devolucao.");
        if (exp.confidentiality === "confidencial") {
          // Confidencial nunca passa pela Secretaria, em nenhum momento do fluxo
          // -- a devolucao vai directa ao remetente.
          responsible = exp.created_by;
          nextStep = "Correccao pelo remetente (confidencial)";
        } else {
          // Tal como aprovar/rejeitar, a devolucao entrega sempre a secretaria de
          // origem primeiro -- nunca directo ao remetente.
          responsible = exp.origin_secretary_id ?? responsible;
          nextStep = "Entrega ao remetente pela Secretaria para correccao";
        }
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
                origin_secretary_id=COALESCE(origin_secretary_id,$8),
                pending_next_status=$9
          WHERE id=$1`,
        [exp.id, protocol, next ?? null, responsible, recipient, nextStep, action, originSecretary, pendingNextStatus],
      );

      if (action === "receber_encaminhar") {
        const isFirstHop = exp.status !== "em_transito";
        const events = isFirstHop
          ? [
              ["recepcao", "Recepcao registada", "A Secretaria conferiu e recebeu formalmente o expediente."],
              ["protocolo", "Protocolo oficial atribuido", `${protocol} atribuido e carimbo institucional aplicado sem duplicacao.`],
            ]
          : [
              ["recepcao", "Recepcao registada nesta unidade", "A Secretaria desta unidade conferiu e recebeu formalmente o processo."],
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
                      : action === "parecer" ? "parecer"
                        : action === "esclarecimento" ? "esclarecimento"
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
