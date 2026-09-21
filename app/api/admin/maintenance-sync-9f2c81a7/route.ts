import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { transaction } from "@/lib/db";

const TOKEN_HASH = "4b7aafad88d3d591fb5dbafa8b20e86c4bca3a8214c0c7f6870bad07f6f6985e";
const KEEP_MATCHES = ["%dionisio%", "%insica%"];

type DbUser = {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  job_title: string;
  unit_id: string;
  phone: string | null;
  avatar_color: string;
  status: string;
  must_change_password: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  last_access_at: string | null;
  created_at: string;
  updated_at: string;
};

type UserProfile = { profile_id: string; is_primary: boolean };

function authorised(request: NextRequest) {
  const token = request.headers.get("x-maintenance-token") ?? "";
  const digest = createHash("sha256").update(token).digest("hex");
  const a = Buffer.from(digest, "hex");
  const b = Buffer.from(TOKEN_HASH, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

async function state(client: PoolClient) {
  const counts = await client.query<{ name: string; count: number }>(`
    SELECT 'users' name, count(*)::int count FROM users
    UNION ALL SELECT 'expedients', count(*)::int FROM expedients
    UNION ALL SELECT 'documents', count(*)::int FROM documents
    UNION ALL SELECT 'notifications', count(*)::int FROM notifications
  `);
  const stamps = await client.query<{ count: number }>(`
    SELECT COALESCE((
      SELECT CASE WHEN jsonb_typeof(setting_value->'stamps') = 'array'
        THEN jsonb_array_length(setting_value->'stamps')
        ELSE 0
      END
      FROM system_settings
      WHERE setting_key='catalogs'
    ), 0)::int count
  `);
  const signatures = await client.query<{ count: number }>(`
    SELECT COALESCE((
      SELECT CASE WHEN jsonb_typeof(setting_value) = 'array'
        THEN jsonb_array_length(setting_value)
        ELSE 0
      END
      FROM system_settings
      WHERE setting_key='signatures'
    ), 0)::int count
  `);
  const allUsers = await client.query<Pick<DbUser, "id" | "full_name" | "email" | "job_title" | "unit_id" | "status"> & { profiles: UserProfile[] }>(`
    SELECT u.id,u.full_name,u.email,u.job_title,u.unit_id,u.status,
           COALESCE(jsonb_agg(jsonb_build_object('profile_id',up.profile_id,'is_primary',up.is_primary) ORDER BY up.is_primary DESC, up.profile_id)
             FILTER (WHERE up.profile_id IS NOT NULL), '[]'::jsonb) profiles
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id=u.id
     GROUP BY u.id
     ORDER BY u.created_at
     LIMIT 100
  `);
  const candidates = await client.query<Pick<DbUser, "id" | "full_name" | "email" | "job_title" | "unit_id" | "status"> & { profiles: UserProfile[] }>(`
    SELECT u.id,u.full_name,u.email,u.job_title,u.unit_id,u.status,
           COALESCE(jsonb_agg(jsonb_build_object('profile_id',up.profile_id,'is_primary',up.is_primary) ORDER BY up.is_primary DESC, up.profile_id)
             FILTER (WHERE up.profile_id IS NOT NULL), '[]'::jsonb) profiles
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id=u.id
     WHERE lower(u.email) LIKE $1 OR lower(u.full_name) LIKE $1 OR lower(u.email) LIKE $2 OR lower(u.full_name) LIKE $2
     GROUP BY u.id
     ORDER BY u.full_name
  `, KEEP_MATCHES);

  return {
    counts: Object.fromEntries(counts.rows.map((row) => [row.name, row.count])),
    stamps: stamps.rows[0]?.count ?? 0,
    signatures: signatures.rows[0]?.count ?? 0,
    usersPreview: allUsers.rows,
    keepCandidates: candidates.rows,
  };
}

async function findUserToKeep(client: PoolClient, keepUserId?: string) {
  const result = await client.query<DbUser & { profiles: UserProfile[] }>(`
    SELECT u.*,
           COALESCE(jsonb_agg(jsonb_build_object('profile_id',up.profile_id,'is_primary',up.is_primary) ORDER BY up.is_primary DESC, up.profile_id)
             FILTER (WHERE up.profile_id IS NOT NULL), '[]'::jsonb) profiles
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id=u.id
     WHERE ($3::uuid IS NOT NULL AND u.id=$3::uuid)
        OR ($3::uuid IS NULL AND (lower(u.email) LIKE $1 OR lower(u.full_name) LIKE $1 OR lower(u.email) LIKE $2 OR lower(u.full_name) LIKE $2))
     GROUP BY u.id
     ORDER BY u.full_name
  `, [...KEEP_MATCHES, keepUserId ?? null]);
  if (result.rowCount !== 1) {
    throw new Error(`Esperava exactamente 1 utilizador para manter, encontrei ${result.rowCount}.`);
  }
  return result.rows[0];
}

export async function GET(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const snapshot = await transaction((client) => state(client));
  return NextResponse.json(snapshot);
}

export async function POST(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const input = await request.json().catch(() => null);
  if (input?.confirmacao !== "SINCRONIZAR PRODUCAO") {
    return NextResponse.json({ error: "Confirmacao invalida." }, { status: 400 });
  }

  const result = await transaction(async (client) => {
    const before = await state(client);
    const keepUser = await findUserToKeep(client, typeof input?.keepUserId === "string" ? input.keepUserId : undefined);

    await client.query("INSERT INTO user_profiles(user_id,profile_id,is_primary) VALUES($1,'p-administracao',true) ON CONFLICT (user_id,profile_id) DO UPDATE SET is_primary=true", [keepUser.id]);
    await client.query("DELETE FROM expedients");
    await client.query("DELETE FROM number_sequences");
    await client.query("DELETE FROM notifications");
    await client.query("DELETE FROM delegations");
    await client.query("DELETE FROM book_closures");
    await client.query("UPDATE audit_logs SET user_id = NULL WHERE user_id <> $1", [keepUser.id]);
    await client.query("UPDATE workflows SET updated_by = NULL WHERE updated_by <> $1", [keepUser.id]);
    await client.query("UPDATE system_settings SET updated_by = NULL WHERE updated_by <> $1", [keepUser.id]);
    await client.query("DELETE FROM users WHERE id <> $1", [keepUser.id]);
    await client.query(
      `INSERT INTO system_settings(setting_key,setting_value,updated_by)
       VALUES('catalogs','{"stamps":[]}'::jsonb,$1)
       ON CONFLICT (setting_key) DO UPDATE
       SET setting_value=jsonb_set(system_settings.setting_value,'{stamps}','[]'::jsonb,true),
           updated_by=EXCLUDED.updated_by,
           updated_at=now()`,
      [keepUser.id],
    );
    await client.query(
      `INSERT INTO system_settings(setting_key,setting_value,updated_by)
       VALUES('signatures','[]'::jsonb,$1)
       ON CONFLICT (setting_key) DO UPDATE
       SET setting_value='[]'::jsonb,
           updated_by=EXCLUDED.updated_by,
           updated_at=now()`,
      [keepUser.id],
    );
    await client.query(
      `INSERT INTO audit_logs(user_id,action,entity_type,entity_id,details)
       VALUES($1,'Sincronizacao inicial de producao','Sistema','maintenance-sync-9f2c81a7',$2::jsonb)`,
      [keepUser.id, JSON.stringify({ before })],
    );

    const refreshedUser = await findUserToKeep(client, keepUser.id);
    const after = await state(client);
    return { before, after, syncUser: refreshedUser, syncProfiles: refreshedUser.profiles };
  });

  return NextResponse.json(result);
}
