import { NextResponse } from "next/server";
import { audit, getCurrentSession } from "@/lib/auth";
import { transaction } from "@/lib/db";

const CONFIRMATION_PHRASE = "ELIMINAR TUDO";

/**
 * Apaga todos os expedientes (e, por cascata, documentos, comentarios, historico
 * e notificacoes ligados a eles) e reinicia a numeracao de protocolos. Nao toca em
 * utilizadores, perfis, estrutura organizacional, configuracoes/catalogos, nem no
 * registo de auditoria -- fica o registo de que esta limpeza aconteceu e quando.
 */
export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.perfilNavegacao !== "administracao") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
  const input = await request.json().catch(() => null);
  if (input?.confirmacao !== CONFIRMATION_PHRASE) {
    return NextResponse.json({ error: `Escreva exactamente "${CONFIRMATION_PHRASE}" para confirmar.` }, { status: 400 });
  }

  const counts = await transaction(async (client) => {
    const expedientsCount = await client.query<{ n: string }>("SELECT count(*)::text n FROM expedients");
    const documentsCount = await client.query<{ n: string }>("SELECT count(*)::text n FROM documents");
    await client.query("DELETE FROM expedients");
    await client.query("DELETE FROM number_sequences");
    return { expedientes: Number(expedientsCount.rows[0].n), documentos: Number(documentsCount.rows[0].n) };
  });

  await audit({
    userId: session.user.id,
    action: "Expedientes zerados",
    entityType: "Sistema",
    entityId: "reset-expedients",
    details: counts,
  });

  return NextResponse.json({ ok: true, ...counts });
}
