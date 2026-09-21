import { NextResponse } from "next/server";
import { audit, getCurrentSession } from "@/lib/auth";
import { transaction } from "@/lib/db";

const CONFIRMATION_PHRASE = "ELIMINAR UTILIZADORES";

/**
 * Apaga todos os utilizadores excepto quem executa a accao (nunca se pode apagar
 * a si proprio, para nao ficar ninguem com acesso). Por arrastar consigo os
 * expedientes de quem for apagado, tambem elimina, por cascata, todos os
 * expedientes, documentos, comentarios, historico e notificacoes -- tal como o
 * "Zerar todos os expedientes" -- e reinicia a numeracao de protocolos.
 * Delegacoes e fechos de livro tambem sao removidos, por dependerem directamente
 * de utilizadores. Carimbos e assinaturas configurados sao esvaziados para
 * recomecar com o administrador real. Perfis, estrutura organizacional, modelos
 * e restantes configuracoes NAO sao afectados -- o registo de auditoria mantem-se
 * (so' fica sem o utilizador associado, quando este ja nao existe).
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
    const usersCount = await client.query<{ n: string }>("SELECT count(*)::text n FROM users WHERE id <> $1", [session.user.id]);
    const expedientsCount = await client.query<{ n: string }>("SELECT count(*)::text n FROM expedients");
    const stampsCount = await client.query<{ n: string }>(
      `SELECT COALESCE((
         SELECT CASE WHEN jsonb_typeof(setting_value->'stamps') = 'array' THEN jsonb_array_length(setting_value->'stamps') ELSE 0 END
           FROM system_settings
          WHERE setting_key='catalogs'
       ), 0)::text n`,
    );
    const signaturesCount = await client.query<{ n: string }>(
      `SELECT COALESCE((
         SELECT CASE WHEN jsonb_typeof(setting_value) = 'array' THEN jsonb_array_length(setting_value) ELSE 0 END
           FROM system_settings
          WHERE setting_key='signatures'
       ), 0)::text n`,
    );

    await client.query("DELETE FROM expedients");
    await client.query("DELETE FROM number_sequences");
    await client.query("DELETE FROM notifications");
    await client.query("DELETE FROM delegations");
    await client.query("DELETE FROM book_closures");
    await client.query("UPDATE audit_logs SET user_id = NULL WHERE user_id <> $1", [session.user.id]);
    await client.query("UPDATE workflows SET updated_by = NULL WHERE updated_by <> $1", [session.user.id]);
    await client.query("UPDATE system_settings SET updated_by = NULL WHERE updated_by <> $1", [session.user.id]);
    await client.query("DELETE FROM users WHERE id <> $1", [session.user.id]);
    await client.query(
      `INSERT INTO system_settings(setting_key,setting_value,updated_by)
       VALUES('catalogs','{"stamps":[]}'::jsonb,$1)
       ON CONFLICT (setting_key) DO UPDATE
       SET setting_value=jsonb_set(system_settings.setting_value,'{stamps}','[]'::jsonb,true),
           updated_by=EXCLUDED.updated_by,
           updated_at=now()`,
      [session.user.id],
    );
    await client.query(
      `INSERT INTO system_settings(setting_key,setting_value,updated_by)
       VALUES('signatures','[]'::jsonb,$1)
       ON CONFLICT (setting_key) DO UPDATE
       SET setting_value='[]'::jsonb,
           updated_by=EXCLUDED.updated_by,
           updated_at=now()`,
      [session.user.id],
    );

    return {
      utilizadores: Number(usersCount.rows[0].n),
      expedientes: Number(expedientsCount.rows[0].n),
      carimbos: Number(stampsCount.rows[0].n),
      assinaturas: Number(signaturesCount.rows[0].n),
    };
  });

  await audit({
    userId: session.user.id,
    action: "Utilizadores eliminados",
    entityType: "Sistema",
    entityId: "reset-users",
    details: counts,
  });

  return NextResponse.json({ ok: true, ...counts });
}
