import { NextRequest,NextResponse } from "next/server";
import { audit,getCurrentSession } from "@/lib/auth";
import { transaction } from "@/lib/db";

export async function PATCH(request:NextRequest,{params}:{params:{id:string}}){
  const session=await getCurrentSession();if(!session||session.perfilNavegacao!=="administracao")return NextResponse.json({error:"Acesso negado."},{status:403});
  try{const input=await request.json();await transaction(async(client)=>{
    await client.query(`UPDATE users SET full_name=COALESCE($2,full_name),email=COALESCE($3,email),job_title=COALESCE($4,job_title),unit_id=COALESCE($5,unit_id),phone=$6,status=COALESCE($7,status) WHERE id=$1`,[params.id,input.nome??null,input.email?.trim().toLowerCase()??null,input.cargo??null,input.unidadeId??null,input.telefone?.trim()||null,input.estado??null]);
    if(input.perfilId){await client.query("UPDATE user_profiles SET is_primary=false WHERE user_id=$1",[params.id]);await client.query("INSERT INTO user_profiles(user_id,profile_id,is_primary) VALUES($1,$2,true) ON CONFLICT(user_id,profile_id) DO UPDATE SET is_primary=true",[params.id,input.perfilId]);}
  });await audit({userId:session.user.id,action:"Utilizador actualizado",entityType:"Utilizador",entityId:params.id,details:{status:input.estado}});return NextResponse.json({ok:true});}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Nao foi possivel actualizar."},{status:400});}
}
