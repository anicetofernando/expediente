import { NextRequest,NextResponse } from "next/server";
import { audit,getCurrentSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { transaction } from "@/lib/db";

export async function POST(request:NextRequest){
  const session=await getCurrentSession();if(!session||session.perfilNavegacao!=="administracao")return NextResponse.json({error:"Acesso negado."},{status:403});
  try{
    const input=await request.json();
    const email=String(input.email??"").trim().toLowerCase();
    if(!input.nome||!email||!input.cargo||!input.unidadeId||!input.perfilId) return NextResponse.json({error:"Preencha todos os campos obrigatorios."},{status:400});
    const passwordHash=await hashPassword("CFM@2026!");
    const user=await transaction(async(client)=>{
      const inserted=await client.query<{id:string}>(`INSERT INTO users(full_name,email,password_hash,job_title,unit_id,phone,avatar_color,status,must_change_password) VALUES($1,$2,$3,$4,$5,$6,'navy',$7,true) RETURNING id`,[input.nome.trim(),email,passwordHash,input.cargo.trim(),input.unidadeId,input.telefone?.trim()||null,input.estado||"activo"]);
      await client.query("INSERT INTO user_profiles(user_id,profile_id,is_primary) VALUES($1,$2,true)",[inserted.rows[0].id,input.perfilId]);return inserted.rows[0];
    });
    await audit({userId:session.user.id,action:"Utilizador criado",entityType:"Utilizador",entityId:user.id,details:{email}});
    return NextResponse.json({ok:true,user:{id:user.id,nome:input.nome.trim(),email,cargo:input.cargo.trim(),unidadeId:input.unidadeId,perfilIds:[input.perfilId],avatarColor:"navy",estado:input.estado||"activo",telefone:input.telefone?.trim()||undefined}},{status:201});
  }catch(error){const code=(error as {code?:string}).code;return NextResponse.json({error:code==="23505"?"Ja existe um utilizador com este e-mail.":error instanceof Error?error.message:"Nao foi possivel criar o utilizador."},{status:400});}
}
