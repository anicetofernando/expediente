import { NextResponse } from "next/server";
import { audit, getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request:Request){
  const session=await getCurrentSession();
  if(!session||!["secretaria","administracao"].includes(session.perfilNavegacao))return NextResponse.json({error:"Acesso negado."},{status:403});
  const input=await request.json().catch(()=>null) as {period?:string}|null;
  if(!input?.period||!/^\d{4}-\d{2}$/.test(input.period))return NextResponse.json({error:"Periodo invalido."},{status:400});
  await query(`INSERT INTO book_closures(period,closed_by) VALUES($1,$2) ON CONFLICT(period) DO NOTHING`,[input.period,session.user.id]);
  await audit({userId:session.user.id,action:"Livro mensal encerrado",entityType:"Livro",entityId:input.period});
  return NextResponse.json({ok:true});
}
