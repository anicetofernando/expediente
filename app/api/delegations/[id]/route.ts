import { NextResponse } from "next/server";
import { audit, getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PATCH(_request:Request,{params}:{params:{id:string}}){
  const session=await getCurrentSession();
  if(!session||!["superior","administracao"].includes(session.perfilNavegacao))return NextResponse.json({error:"Acesso negado."},{status:403});
  const result=await query("UPDATE delegations SET active=false WHERE id=$1 RETURNING id",[params.id]);
  if(!result.rowCount)return NextResponse.json({error:"Delegacao nao encontrada."},{status:404});
  await audit({userId:session.user.id,action:"Delegacao encerrada",entityType:"Delegacao",entityId:params.id});
  return NextResponse.json({ok:true});
}
