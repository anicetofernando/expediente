import { NextResponse } from "next/server";
import { audit, getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  const session=await getCurrentSession();
  if(!session||!["superior","administracao"].includes(session.perfilNavegacao))return NextResponse.json({error:"Acesso negado."},{status:403});
  const input=await request.json().catch(()=>null);
  if(!input?.delegatorId||!input?.delegateId||!input?.startsOn||!input?.endsOn||!input?.reason?.trim())return NextResponse.json({error:"Preencha todos os campos."},{status:400});
  try{
    const result=await query<{id:string}>(`INSERT INTO delegations(delegator_id,delegate_id,starts_on,ends_on,reason) VALUES($1,$2,$3,$4,$5) RETURNING id`,[input.delegatorId,input.delegateId,input.startsOn,input.endsOn,input.reason.trim()]);
    await audit({userId:session.user.id,action:"Delegacao criada",entityType:"Delegacao",entityId:result.rows[0].id});
    return NextResponse.json({ok:true,id:result.rows[0].id},{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Nao foi possivel criar a delegacao."},{status:400});}
}
