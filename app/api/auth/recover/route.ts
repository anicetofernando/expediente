import { NextResponse } from "next/server";
import { audit } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request:Request){
  const input=await request.json().catch(()=>null) as {email?:string}|null;
  const email=input?.email?.trim().toLowerCase();
  if(!email)return NextResponse.json({error:"Introduza o e-mail institucional."},{status:400});
  const user=await query<{id:string;full_name:string}>("SELECT id,full_name FROM users WHERE lower(email)=lower($1) AND status='activo'",[email]);
  if(user.rows[0]){
    await query(`INSERT INTO notifications(user_id,notification_type,title,description,urgent)
      SELECT DISTINCT u.id,'sistema','Pedido de recuperacao de acesso',$1,true FROM users u
      JOIN user_profiles up ON up.user_id=u.id JOIN profiles p ON p.id=up.profile_id
      WHERE p.slug='administracao' AND u.status='activo'`,[`${user.rows[0].full_name} (${email}) solicitou reposicao da palavra-passe.`]);
    await audit({userId:user.rows[0].id,action:"Recuperacao de acesso solicitada",entityType:"Utilizador",entityId:user.rows[0].id});
  }else{
    await audit({action:"Recuperacao de acesso solicitada",entityType:"Utilizador",entityId:email,result:"falha",details:{reason:"unknown_user"}});
  }
  return NextResponse.json({ok:true});
}
