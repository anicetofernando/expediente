import { NextRequest,NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { audit,getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request:NextRequest,{params}:{params:{id:string}}){
  const session=await getCurrentSession();if(!session)return NextResponse.json({error:"Nao autenticado."},{status:401});
  let input:{body?:string;internal?:boolean};try{input=await request.json();}catch{return NextResponse.json({error:"Pedido invalido."},{status:400});}
  const body=input.body?.trim();if(!body)return NextResponse.json({error:"Escreva o comentario."},{status:400});
  const access=await query<{created_by:string;responsible_user_id:string|null;origin_unit_id:string;recipient_unit_id:string}>("SELECT created_by,responsible_user_id,origin_unit_id,recipient_unit_id FROM expedients WHERE id=$1",[params.id]);
  const exp=access.rows[0];if(!exp)return NextResponse.json({error:"Expediente nao encontrado."},{status:404});
  const allowed=session.perfilNavegacao==="administracao"||session.perfilNavegacao==="secretaria"||exp.created_by===session.user.id||exp.responsible_user_id===session.user.id||(session.perfilNavegacao==="superior"&&(exp.origin_unit_id===session.user.unidadeId||exp.recipient_unit_id===session.user.unidadeId));
  if(!allowed)return NextResponse.json({error:"Acesso negado."},{status:403});
  const result=await query<{id:string;created_at:string}>("INSERT INTO comments(expedient_id,author_id,body,internal) VALUES($1,$2,$3,$4) RETURNING id,created_at",[params.id,session.user.id,body,input.internal!==false]);
  await query("INSERT INTO timeline_events(expedient_id,event_type,title,description,user_id,unit_id) VALUES($1,'comentario','Comentario adicionado',$2,$3,$4)",[params.id,body,session.user.id,session.user.unidadeId]);
  await audit({userId:session.user.id,action:"Comentario adicionado",entityType:"Expediente",entityId:params.id,details:{message:body}});
  revalidatePath(`/expedientes/${params.id}`);
  return NextResponse.json({ok:true,comment:{id:result.rows[0].id,autor:session.user.nome,cargo:session.user.cargo,data:new Date(result.rows[0].created_at).toISOString(),texto:body,interno:input.internal!==false}},{status:201});
}
