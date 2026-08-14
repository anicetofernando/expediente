import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

interface DocumentAccessRow { name:string;mime_type:string|null;storage_path:string|null;content_html:string|null;created_by:string;origin_unit_id:string;recipient_unit_id:string;responsible_user_id:string|null }

export async function GET(_: Request,{ params }:{ params:{ id:string } }) {
  const session=await getCurrentSession();
  if(!session) return NextResponse.json({error:"Nao autenticado."},{status:401});
  const result=await query<DocumentAccessRow>(`SELECT d.name,d.mime_type,d.storage_path,d.content_html,e.created_by,e.origin_unit_id,e.recipient_unit_id,e.responsible_user_id FROM documents d JOIN expedients e ON e.id=d.expedient_id WHERE d.id=$1`,[params.id]);
  const doc=result.rows[0];
  if(!doc) return NextResponse.json({error:"Documento nao encontrado."},{status:404});
  const allowed=session.perfilNavegacao==="administracao"||session.perfilNavegacao==="secretaria"||doc.created_by===session.user.id||doc.responsible_user_id===session.user.id||(session.perfilNavegacao==="superior"&&(doc.origin_unit_id===session.user.unidadeId||doc.recipient_unit_id===session.user.unidadeId));
  if(!allowed) return NextResponse.json({error:"Acesso negado."},{status:403});
  if(doc.content_html!==null) return new NextResponse(doc.content_html,{headers:{"content-type":"text/html; charset=utf-8","content-disposition":`inline; filename="${doc.name.replace(/"/g,"")}"`}});
  if(!doc.storage_path) return NextResponse.json({error:"Ficheiro indisponivel."},{status:404});
  const root=path.resolve(process.cwd(),"storage","uploads");
  const target=path.resolve(root,doc.storage_path);
  if(!target.startsWith(root+path.sep)) return NextResponse.json({error:"Caminho invalido."},{status:400});
  try {
    const data=await readFile(target);
    return new NextResponse(data,{headers:{"content-type":doc.mime_type||"application/octet-stream","content-disposition":`inline; filename="${doc.name.replace(/"/g,"")}"`,"content-length":String(data.length)}});
  } catch {
    return NextResponse.json({error:"Ficheiro nao encontrado no armazenamento."},{status:404});
  }
}
