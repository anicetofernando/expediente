import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const KEY = "77bb0ad8347a6f196511010312dc9662";

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("key") !== KEY) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const users = await query(
      `SELECT u.id, u.full_name, u.email, u.unit_id, ou.name unit_name, ou.acronym,
              (SELECT p.slug FROM user_profiles up JOIN profiles p ON p.id=up.profile_id WHERE up.user_id=u.id AND up.is_primary=true LIMIT 1) profile_slug
         FROM users u LEFT JOIN organizational_units ou ON ou.id=u.unit_id
        WHERE lower(u.email) IN ('zanda@cfm.com','any@cfm.com')`,
    );

    const unitUsers = await query(
      `SELECT u.id, u.full_name, u.email, u.status, p.slug profile_slug, p.access_level
         FROM users u
         JOIN user_profiles up ON up.user_id=u.id AND up.is_primary=true
         JOIN profiles p ON p.id=up.profile_id
        WHERE u.unit_id='u-mt4lspwt'
        ORDER BY u.full_name`,
    );
    const efd = await query(`SELECT id, full_name, email, unit_id, status FROM users WHERE id='efd47111-d372-47bb-a05f-d13705238f7e'`);

    const anyUser = users.rows.find((u: any) => u.email.toLowerCase() === "any@cfm.com");
    const zandaUser = users.rows.find((u: any) => u.email.toLowerCase() === "zanda@cfm.com");

    let anyAuth: any = null;
    if (anyUser) {
      const catalogs = await query<{ setting_value: any }>("SELECT setting_value FROM system_settings WHERE setting_key='catalogs'");
      const signatures = await query<{ setting_value: any }>("SELECT setting_value FROM system_settings WHERE setting_key='signatures'");
      const stamps = (catalogs.rows[0]?.setting_value?.stamps ?? []) as any[];
      const sigs = (signatures.rows[0]?.setting_value ?? []) as any[];
      anyAuth = {
        stampsForHerUnit: stamps.filter((s) => s.unidade === anyUser.unit_name || s.unidade === "Global"),
        signatureMatches: sigs.filter((s) => (s.email && s.email.toLowerCase() === "any@cfm.com") || s.utilizadorId === anyUser.id || (s.proprietario && s.proprietario.toLowerCase().includes(anyUser.full_name.toLowerCase().split(" ")[0]))),
      };
    }

    let expedients: any[] = [];
    if (anyUser || zandaUser) {
      const ids = [anyUser?.id, zandaUser?.id].filter(Boolean);
      const r = await query(
        `SELECT e.id, e.protocol, e.subject, e.status, e.pending_next_status, e.responsible_user_id, e.recipient_unit_id, e.origin_unit_id,
                ru.full_name responsible_name, ou.name recipient_unit_name, e.created_at, e.updated_at
           FROM expedients e
           LEFT JOIN users ru ON ru.id=e.responsible_user_id
           LEFT JOIN organizational_units ou ON ou.id=e.recipient_unit_id
          WHERE e.responsible_user_id = ANY($1::uuid[]) OR e.recipient_unit_id IN (
                SELECT unit_id FROM users WHERE id = ANY($1::uuid[])
              )
          ORDER BY e.updated_at DESC LIMIT 15`,
        [ids],
      );
      expedients = r.rows;
    }

    let recentDocs: any[] = [];
    if (expedients.length) {
      const expIds = expedients.map((e) => e.id);
      const r = await query(
        `SELECT id, expedient_id, name, document_kind, stamped, signed, created_by, created_for_unit_id,
                (SELECT full_name FROM users WHERE id=created_by) creator_name, created_at
           FROM documents WHERE expedient_id = ANY($1::uuid[]) ORDER BY created_at DESC`,
        [expIds],
      );
      recentDocs = r.rows;
    }

    return NextResponse.json({ users: users.rows, unitUsers: unitUsers.rows, efd: efd.rows, anyAuth, expedients, recentDocs });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed", stack: error instanceof Error ? error.stack : undefined }, { status: 500 });
  }
}
