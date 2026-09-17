import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const KEY = "34acb7dacce2e6b0074072af593f4d46";

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("key") !== KEY) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const expedients = await query(
      `SELECT e.id, e.protocol, e.subject, e.status, e.pending_next_status, e.responsible_user_id, e.recipient_unit_id, e.origin_unit_id,
              ru.full_name responsible_name, ru.email responsible_email, ou.name recipient_unit_name, e.created_at, e.updated_at
         FROM expedients e
         LEFT JOIN users ru ON ru.id=e.responsible_user_id
         LEFT JOIN organizational_units ou ON ou.id=e.recipient_unit_id
        WHERE e.recipient_unit_id='u-mt4lspwt' OR e.origin_unit_id='u-mt4lspwt'
        ORDER BY e.updated_at DESC LIMIT 10`,
    );

    const expIds = expedients.rows.map((e: any) => e.id);
    let recentDocs: any[] = [];
    let timeline: any[] = [];
    if (expIds.length) {
      const r = await query(
        `SELECT id, expedient_id, name, document_kind, stamped, signed, created_by,
                (SELECT full_name FROM users WHERE id=created_by) creator_name, created_at
           FROM documents WHERE expedient_id = ANY($1::uuid[]) ORDER BY created_at DESC`,
        [expIds],
      );
      recentDocs = r.rows;
      const t = await query(
        `SELECT expedient_id, event_type, title, description, created_at,
                (SELECT full_name FROM users WHERE id=t.user_id) user_name
           FROM timeline_events t WHERE expedient_id = ANY($1::uuid[]) ORDER BY created_at DESC LIMIT 20`,
        [expIds],
      );
      timeline = t.rows;
    }

    const unitUsers = await query(
      `SELECT u.id, u.full_name, u.email, u.status, p.slug profile_slug, p.access_level, up.is_primary
         FROM users u
         JOIN user_profiles up ON up.user_id=u.id
         JOIN profiles p ON p.id=up.profile_id
        WHERE u.unit_id='u-mt4lspwt'
        ORDER BY u.full_name, up.is_primary DESC`,
    );

    return NextResponse.json({ expedients: expedients.rows, recentDocs, timeline, unitUsers: unitUsers.rows });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed", stack: error instanceof Error ? error.stack : undefined }, { status: 500 });
  }
}
