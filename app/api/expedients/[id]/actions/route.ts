import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { audit, getCurrentSession } from "@/lib/auth";
import { transaction } from "@/lib/db";

const PROFILE_ACTIONS: Record<string, Set<string>> = {
  remetente: new Set(["submeter","resposta","confirmar","arquivar"]),
  secretaria: new Set(["receber","protocolar","encaminhar","carimbo","disponibilizar","arquivar","notificar"]),
  superior: new Set(["encaminhar","parecer","esclarecimento","aprovar","rejeitar","devolver","resposta","assinatura","disponibilizar","retomar","escalar"]),
  administracao: new Set(["submeter","receber","protocolar","encaminhar","parecer","esclarecimento","aprovar","rejeitar","devolver","resposta","carimbo","assinatura","disponibilizar","confirmar","arquivar","retomar","escalar","notificar"]),
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
  resposta:"Resposta registada",carimbo:"Carimbo aplicado",assinatura:"Assinatura aplicada",disponibilizar:"Disponibilizado ao remetente",
  confirmar:"Recebimento confirmado",arquivar:"Expediente arquivado",retomar:"Tramitacao retomada",escalar:"Prioridade escalada",notificar:"Remetente notificado",
};

export async function POST(request:NextRequest,{params}:{params:{id:string}}){
  const session=await getCurrentSession();
  if(!session) return NextResponse.json({error:"Nao autenticado."},{status:401});
  let input:{action?:string;note?:string;target?:string};
  try{input=await request.json();}catch{return NextResponse.json({error:"Pedido invalido."},{status:400});}
  const action=input.action??"";
  if(!PROFILE_ACTIONS[session.perfilNavegacao]?.has(action)) return NextResponse.json({error:"Acção não permitida para o seu perfil."},{status:403});
  try{
    const changed=await transaction(async(client)=>{
      const found=await client.query<{id:string;protocol:string;subject:string;status:string;created_by:string;origin_unit_id:string;recipient_unit_id:string;responsible_user_id:string|null}>("SELECT id,protocol,subject,status,created_by,origin_unit_id,recipient_unit_id,responsible_user_id FROM expedients WHERE id=$1 FOR UPDATE",[params.id]);
      const exp=found.rows[0];
      if(!exp) throw new Error("Expediente nao encontrado.");
      const allowedByStatus:Record<string,string[]>={rascunho:["submeter"],submetido:["receber"],recebido:["protocolar"],protocolado:["encaminhar","carimbo"],encaminhado:["parecer","devolver","aprovar"],em_analise:["aprovar","rejeitar","devolver","parecer","esclarecimento"],aguardando_parecer:["resposta","esclarecimento"],aguardando_esclarecimento:["resposta"],devolvido:["resposta","encaminhar"],aprovado:["resposta","assinatura","disponibilizar"],rejeitado:["notificar","arquivar"],disponivel_remetente:["confirmar"],recebimento_confirmado:["arquivar"],suspenso:["retomar"],expirado:["escalar","arquivar"],atrasado:["escalar","encaminhar","aprovar"]};
      if(!allowedByStatus[exp.status]?.includes(action)) throw new Error("Esta accao nao e valida no estado actual do expediente.");
      const hasAccess=session.perfilNavegacao==="administracao"||session.perfilNavegacao==="secretaria"||exp.created_by===session.user.id||exp.responsible_user_id===session.user.id||(session.perfilNavegacao==="superior"&&(exp.origin_unit_id===session.user.unidadeId||exp.recipient_unit_id===session.user.unidadeId));
      if(!hasAccess) throw new Error("Sem acesso a este expediente.");
      let responsible=exp.responsible_user_id;
      let recipient=exp.recipient_unit_id;
      if(action==="submeter"){
        const secretary=await client.query<{id:string}>(`SELECT u.id FROM users u JOIN user_profiles up ON up.user_id=u.id JOIN profiles p ON p.id=up.profile_id WHERE p.slug='secretaria' AND u.status='activo' ORDER BY u.full_name LIMIT 1`);
        if(!secretary.rows[0]) throw new Error("Nao existe utilizador activo da Secretaria.");
        responsible=secretary.rows[0].id;
      }
      if(action==="encaminhar"||action==="parecer"){
        if(!input.target) throw new Error("Seleccione a unidade destinataria.");
        const target=await client.query<{id:string}>(`SELECT u.id FROM users u JOIN user_profiles up ON up.user_id=u.id JOIN profiles p ON p.id=up.profile_id WHERE u.unit_id=$1 AND u.status='activo' ORDER BY CASE WHEN p.slug='superior' THEN 0 ELSE 1 END,u.full_name LIMIT 1`,[input.target]);
        if(!target.rows[0]) throw new Error("A unidade seleccionada nao tem utilizador activo.");
        responsible=target.rows[0].id;
        recipient=input.target;
      }
      if(action==="resposta"&&session.perfilNavegacao==="remetente") responsible=session.user.id;
      const next=NEXT_STATUS[action];
      const nextStep=action==="submeter"?"Recepcao pela Secretaria":action==="aprovar"?"Preparar e disponibilizar resposta":action==="disponibilizar"?"Confirmacao do remetente":action==="confirmar"?"Arquivo":action==="arquivar"?"Concluido":action==="devolver"?"Correccao pelo remetente":action==="parecer"?"Emissao de parecer":"Continuar tramitacao";
      await client.query(`UPDATE expedients SET status=COALESCE($2,status),responsible_user_id=$3,recipient_unit_id=$4,next_step=$5,priority=CASE WHEN $6='escalar' THEN 'urgente' ELSE priority END,completed_at=CASE WHEN $6='arquivar' THEN now() ELSE completed_at END,submitted_at=CASE WHEN $6='submeter' THEN now() ELSE submitted_at END WHERE id=$1`,[exp.id,next??null,responsible,recipient,nextStep,action]);
      if(action==="carimbo") await client.query("UPDATE documents SET stamped=true WHERE expedient_id=$1 AND document_kind='principal'",[exp.id]);
      if(action==="assinatura") await client.query("UPDATE documents SET signed=true WHERE expedient_id=$1 AND document_kind='principal'",[exp.id]);
      await client.query(`INSERT INTO timeline_events(expedient_id,event_type,title,description,user_id,unit_id) VALUES($1,$2,$3,$4,$5,$6)`,[exp.id,action==="receber"?"recepcao":action==="protocolar"?"protocolo":action==="encaminhar"?"encaminhamento":action==="aprovar"?"aprovacao":action==="rejeitar"?"rejeicao":action==="devolver"?"devolucao":action==="carimbo"?"carimbo":action==="assinatura"?"assinatura":action==="disponibilizar"?"entrega":action==="confirmar"?"confirmacao":action==="arquivar"?"arquivo":"comentario",LABELS[action]??action,input.note?.trim()||LABELS[action]||action,session.user.id,session.user.unidadeId]);
      const notifyIds=new Set([exp.created_by,responsible].filter(Boolean));
      for(const userId of notifyIds) if(userId!==session.user.id) await client.query("INSERT INTO notifications(user_id,notification_type,title,description,expedient_id,urgent) VALUES($1,'tarefa',$2,$3,$4,$5)",[userId,LABELS[action]??"Expediente actualizado",`${exp.protocol} - ${exp.subject}`,exp.id,action==="escalar"]);
      return exp;
    });
    await audit({userId:session.user.id,action:LABELS[action]??action,entityType:"Expediente",entityId:params.id,details:{message:input.note?.trim()||LABELS[action],protocol:changed.protocol},ip:request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()??null});
    revalidatePath(`/expedientes/${params.id}`);revalidatePath("/expedientes");
    return NextResponse.json({ok:true,message:LABELS[action]??"Acção registada."});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Nao foi possivel registar a acção."},{status:400});}
}
