import { NextResponse } from "next/server";
import { audit, getCurrentSession } from "@/lib/auth";
import { transaction } from "@/lib/db";
import { deleteFile } from "@/lib/file-storage";

const CONFIRMATION_PHRASE = "ELIMINAR EXPEDIENTES";

/**
 * Apaga apenas expedientes e tudo o que pertence a eles: documentos principais,
 * notas, protocolos, despachos/respostas, anexos, comentarios, tramitacao,
 * notificacoes ligadas e ficheiros importados. Nao toca em utilizadores, perfis,
 * estrutura organizacional, carimbos, assinaturas, modelos, configuracoes/catalogos
 * nem no registo de auditoria -- fica o registo de que esta limpeza aconteceu.
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

  const result = await transaction(async (client) => {
    const expedientsCount = await client.query<{ n: string }>("SELECT count(*)::text n FROM expedients");
    const documentsCount = await client.query<{ n: string }>("SELECT count(*)::text n FROM documents");
    const notesCount = await client.query<{ n: string }>("SELECT count(*)::text n FROM documents WHERE document_kind='nota'");
    const attachmentsCount = await client.query<{ n: string }>("SELECT count(*)::text n FROM documents WHERE document_kind='anexo'");
    const storedFiles = await client.query<{ storage_path: string }>(
      "SELECT DISTINCT storage_path FROM documents WHERE storage_path IS NOT NULL AND storage_path <> ''",
    );

    await client.query("DELETE FROM notifications WHERE expedient_id IS NOT NULL");
    await client.query("DELETE FROM comments");
    await client.query("DELETE FROM timeline_events");
    await client.query("DELETE FROM documents");
    await client.query("DELETE FROM expedients");
    await client.query("DELETE FROM number_sequences");
    return {
      counts: {
        expedientes: Number(expedientsCount.rows[0].n),
        documentos: Number(documentsCount.rows[0].n),
        notas: Number(notesCount.rows[0].n),
        anexos: Number(attachmentsCount.rows[0].n),
      },
      storagePaths: storedFiles.rows.map((row) => row.storage_path),
    };
  });

  const storage = { ficheiros: result.storagePaths.length, removidos: 0, falhas: 0 };
  for (const storagePath of result.storagePaths) {
    try {
      if (await deleteFile(storagePath)) storage.removidos += 1;
    } catch {
      storage.falhas += 1;
    }
  }
  const counts = { ...result.counts, ficheiros: storage.removidos, ficheirosFalhados: storage.falhas };

  await audit({
    userId: session.user.id,
    action: "Expedientes e documentos eliminados",
    entityType: "Sistema",
    entityId: "reset-expedients",
    details: { ...counts, ficheirosEncontrados: storage.ficheiros },
  });

  return NextResponse.json({ ok: true, ...counts });
}
