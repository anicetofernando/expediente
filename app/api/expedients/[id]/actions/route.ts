import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { audit, getCurrentSession } from "@/lib/auth";
import { transaction } from "@/lib/db";
import type { FreePosition } from "@/types";
import { dateValueInMaputo, isValidFutureOrTodayDate } from "@/lib/date-only";
import { configuredDocumentTypes, requiresDirectorEscalation, resolveSecretaryId, secretaryOwnedUnitIds } from "@/lib/routing";
import { rememberStampSignaturePositions, resolveMandatoryStampSignature, signatureMetadataJson, stampMetadataJson } from "@/lib/stamping";
import { generateProtocolNumber } from "@/lib/numbering";

const PROFILE_ACTIONS: Record<string, Set<string>> = {
  remetente: new Set(["submeter","resposta","confirmar","arquivar"]),
  secretaria: new Set(["receber","protocolar","encaminhar","disponibilizar","arquivar","notificar"]),
  superior: new Set(["encaminhar","parecer","esclarecimento","aprovar","rejeitar","devolver","resposta","disponibilizar","retomar","escalar"]),
  administracao: new Set(["submeter","receber","protocolar","encaminhar","parecer","esclarecimento","aprovar","rejeitar","devolver","resposta","disponibilizar","confirmar","arquivar","retomar","escalar","notificar"]),
};

const NEXT_STATUS: Record<string,string|undefined> = {
  submeter:"submetido",
  receber:"recebido",protocolar:"protocolado",encaminhar:"encaminhado",parecer:"aguardando_parecer",
  esclarecimento:"aguardando_esclarecimento",aprovar:"aprovado",rejeitar:"rejeitado",devolver:"devolvido",
  resposta:"em_analise",disponibilizar:"disponivel_remetente",confirmar:"recebimento_confirmado",arquivar:"arquivado",
  retomar:"em_analise",escalar:"atrasado",
};

const LABELS: Record<string,string> = {
  submeter:"Expediente submetido",
  receber:"Expediente recebido",protocolar:"Expediente protocolado",encaminhar:"Expediente encaminhado",parecer:"Parecer solicitado",
  esclarecimento:"Esclarecimento solicitado",aprovar:"Expediente aprovado",rejeitar:"Expediente rejeitado",devolver:"Devolvido para correccao",
  resposta:"Resposta registada",disponibilizar:"Disponibilizado ao remetente",
  confirmar:"Recebimento confirmado",arquivar:"Expediente arquivado",retomar:"Tramitacao retomada",escalar:"Prioridade escalada",notificar:"Remetente notificado",
};

export async function POST(request:NextRequest,{params}:{params:{id:string}}){
  const session=await getCurrentSession();
  if(!session) return NextResponse.json({error:"Nao autenticado."},{status:401});
  let input:{action?:string;note?:string;target?:string;posicaoCarimbo?:FreePosition;posicaoAssinatura?:FreePosition};
  try{input=await request.json();}catch{return NextResponse.json({error:"Pedido invalido."},{status:400});}
  const action=input.action??"";
  if(!PROFILE_ACTIONS[session.perfilNavegacao]?.has(action)) return NextResponse.json({error:"Acção não permitida para o seu perfil."},{status:403});
  try{
    const changed=await transaction(async(client)=>{
      const found=await client.query<{id:string;protocol:string;subject:string;status:string;created_by:string;origin_unit_id:string;recipient_unit_id:string;responsible_user_id:string|null;due_date:string|Date;document_type:string;origin_secretary_id:string|null}>("SELECT id,protocol,subject,status,created_by,origin_unit_id,recipient_unit_id,responsible_user_id,due_date,document_type,origin_secretary_id FROM expedients WHERE id=$1 FOR UPDATE",[params.id]);
      const exp=found.rows[0];
      if(!exp) throw new Error("Expediente nao encontrado.");
      const allowedByStatus:Record<string,string[]>={rascunho:["submeter"],submetido:["receber"],recebido:["protocolar"],protocolado:["encaminhar"],encaminhado:["encaminhar","parecer","devolver","aprovar"],em_analise:["encaminhar","aprovar","rejeitar","devolver","parecer","esclarecimento"],aguardando_parecer:["resposta","esclarecimento"],aguardando_esclarecimento:["resposta"],devolvido:["resposta","encaminhar"],aprovado:["resposta","disponibilizar"],rejeitado:["notificar","arquivar"],disponivel_remetente:["confirmar"],recebimento_confirmado:["arquivar"],suspenso:["retomar"],expirado:["escalar","arquivar"],atrasado:["escalar","encaminhar","aprovar"]};
      if(!allowedByStatus[exp.status]?.includes(action)) throw new Error("Esta accao nao e valida no estado actual do expediente.");
      const secretaryUnits=session.perfilNavegacao==="secretaria"?await secretaryOwnedUnitIds(client,session.user.id):[];
      const hasAccess=session.perfilNavegacao==="administracao"||(session.perfilNavegacao==="secretaria"&&exp.status!=="rascunho"&&(secretaryUnits.includes(exp.recipient_unit_id)||secretaryUnits.includes(exp.origin_unit_id)))||exp.created_by===session.user.id||exp.responsible_user_id===session.user.id||(session.perfilNavegacao==="superior"&&(exp.origin_unit_id===session.user.unidadeId||exp.recipient_unit_id===session.user.unidadeId));
      if(!hasAccess) throw new Error("Sem acesso a este expediente.");
      if(action==="aprovar"&&session.perfilNavegacao==="superior"){
        const [docTypes,recipientUnit]=await Promise.all([
          configuredDocumentTypes(client),
          client.query<{unit_type:string}>("SELECT unit_type FROM organizational_units WHERE id=$1",[exp.recipient_unit_id]),
        ]);
        if(requiresDirectorEscalation(recipientUnit.rows[0]?.unit_type,exp.document_type,docTypes)) throw new Error("Este tipo de documento exige aprovacao da direccao. Encaminhe para a unidade superior antes de aprovar.");
      }
      let responsible=exp.responsible_user_id;
      let recipient=exp.recipient_unit_id;
      let protocol=exp.protocol;
      let originSecretary=exp.origin_secretary_id;
      if(action==="submeter"){
        if(!isValidFutureOrTodayDate(dateValueInMaputo(exp.due_date))) throw new Error("Actualize a data de entrega: nao pode ser anterior ao dia de hoje.");
        const secretaryId=await resolveSecretaryId(client,exp.recipient_unit_id);
        if(!secretaryId) throw new Error("Nao existe utilizador activo da Secretaria.");
        responsible=secretaryId;
        originSecretary=secretaryId;
        if(protocol.startsWith("RASCUNHO-")){
          const unit=await client.query<{acronym:string}>("SELECT acronym FROM organizational_units WHERE id=$1 AND active=true",[exp.origin_unit_id]);
          if(!unit.rows[0]) throw new Error("Unidade de origem invalida.");
          protocol=await generateProtocolNumber(client,exp.origin_unit_id,unit.rows[0].acronym,new Date().getFullYear());
        }
      }
      if(action==="encaminhar"||action==="parecer"){
        if(!input.target) throw new Error("Seleccione a unidade destinataria.");
        // Se a unidade de destino tiver secretaria propria, o expediente passa
        // primeiro por ela (gestao administrativa) antes de chegar a' chefia --
        // excepto quando quem esta' a encaminhar e' precisamente essa secretaria,
        // caso em que o alvo e' a chefia (ela ja' geriu a entrada). Sem
        // secretaria propria naquela unidade, segue directamente para a chefia.
        const targetSecretary=await client.query<{id:string}>(`SELECT u.id FROM users u JOIN user_profiles up ON up.user_id=u.id JOIN profiles p ON p.id=up.profile_id WHERE u.unit_id=$1 AND u.status='activo' AND p.slug='secretaria' AND u.id<>$2 ORDER BY u.full_name LIMIT 1`,[input.target,session.user.id]);
        const target=targetSecretary.rows[0]
          ? targetSecretary
          : await client.query<{id:string}>(`SELECT u.id FROM users u JOIN user_profiles up ON up.user_id=u.id JOIN profiles p ON p.id=up.profile_id WHERE u.unit_id=$1 AND u.status='activo' ORDER BY CASE WHEN p.slug='superior' THEN 0 ELSE 1 END,u.full_name LIMIT 1`,[input.target]);
        if(!target.rows[0]) throw new Error("A unidade seleccionada nao tem utilizador activo.");
        responsible=target.rows[0].id;
        recipient=input.target;
      }
      if(action==="resposta"&&session.perfilNavegacao==="remetente") responsible=session.user.id;
      if(action==="aprovar"&&exp.origin_secretary_id) responsible=exp.origin_secretary_id;
      const next=NEXT_STATUS[action];
      const nextStep=action==="submeter"?"Recepcao pela Secretaria":action==="aprovar"?"Disponibilizar ao remetente":action==="disponibilizar"?"Confirmacao do remetente":action==="confirmar"?"Arquivo":action==="arquivar"?"Concluido":action==="devolver"?"Correccao pelo remetente":action==="parecer"?"Emissao de parecer":"Continuar tramitacao";
      await client.query(`UPDATE expedients SET protocol=$2,status=COALESCE($3,status),responsible_user_id=$4,recipient_unit_id=$5,next_step=$6,priority=CASE WHEN $7='escalar' THEN 'urgente' ELSE priority END,completed_at=CASE WHEN $7='arquivar' THEN now() ELSE completed_at END,submitted_at=CASE WHEN $7='submeter' THEN now() ELSE submitted_at END,origin_secretary_id=COALESCE(origin_secretary_id,$8) WHERE id=$1`,[exp.id,protocol,next??null,responsible,recipient,nextStep,action,originSecretary]);
      if(action==="protocolar"){
        const resolved=await resolveMandatoryStampSignature(client,session.user,session.unitName,session.perfilNavegacao);
        await client.query(
          "UPDATE documents SET stamped=true,signed=true,stamp_id=$2,stamp_metadata=$3::jsonb,signature_metadata=$4::jsonb WHERE expedient_id=$1 AND document_kind='principal'",
          [exp.id,resolved.stamp.id,JSON.stringify(stampMetadataJson(resolved.stamp,session.user.nome,input.posicaoCarimbo)),JSON.stringify(signatureMetadataJson(resolved.signature,session.user,input.posicaoAssinatura))],
        );
        await rememberStampSignaturePositions(client,resolved.stamp,resolved.signature,input.posicaoCarimbo,input.posicaoAssinatura);
      }
      await client.query(`INSERT INTO timeline_events(expedient_id,event_type,title,description,user_id,unit_id) VALUES($1,$2,$3,$4,$5,$6)`,[exp.id,action==="receber"?"recepcao":action==="protocolar"?"protocolo":action==="encaminhar"?"encaminhamento":action==="aprovar"?"aprovacao":action==="rejeitar"?"rejeicao":action==="devolver"?"devolucao":action==="disponibilizar"?"entrega":action==="confirmar"?"confirmacao":action==="arquivar"?"arquivo":"comentario",LABELS[action]??action,input.note?.trim()||LABELS[action]||action,session.user.id,session.user.unidadeId]);
      const notifyIds=new Set([exp.created_by,responsible].filter(Boolean));
      if(action==="aprovar"){
        const chain=await client.query<{user_id:string|null}>("SELECT DISTINCT user_id FROM timeline_events WHERE expedient_id=$1 AND event_type='encaminhamento'",[exp.id]);
        for(const row of chain.rows) if(row.user_id) notifyIds.add(row.user_id);
      }
      for(const userId of notifyIds) if(userId!==session.user.id) await client.query("INSERT INTO notifications(user_id,notification_type,title,description,expedient_id,urgent) VALUES($1,'tarefa',$2,$3,$4,$5)",[userId,LABELS[action]??"Expediente actualizado",`${protocol} - ${exp.subject}`,exp.id,action==="escalar"]);
      return {...exp,protocol};
    });
    await audit({userId:session.user.id,action:LABELS[action]??action,entityType:"Expediente",entityId:params.id,details:{message:input.note?.trim()||LABELS[action],protocol:changed.protocol},ip:request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()??null});
    revalidatePath(`/expedientes/${params.id}`);revalidatePath("/expedientes");
    return NextResponse.json({ok:true,message:LABELS[action]??"Acção registada.",protocolo:changed.protocol});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Nao foi possivel registar a acção."},{status:400});}
}
