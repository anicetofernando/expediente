import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { PerfilNavegacao } from "@/config/navigation";
import type { AuthSession } from "@/lib/session-types";
import { query } from "@/lib/db";

const COOKIE_NAME = "cfm-expediente-auth";
const MAX_AGE_SECONDS = 60 * 60 * 12;

interface TokenPayload { uid: string; exp: number }

interface SessionRow {
  id: string;
  full_name: string;
  email: string;
  job_title: string;
  unit_id: string;
  phone: string | null;
  avatar_color: string;
  status: "activo" | "inactivo" | "suspenso";
  last_access_at: string | null;
  must_change_password: boolean;
  profile_id: string;
  profile_slug: PerfilNavegacao;
  profile_name: string;
  profile_description: string;
  access_level: "operacional" | "supervisao" | "direccao" | "administracao";
  profile_scope: "global" | "unidade" | "sector";
  permissions: string[];
  unit_name: string;
}

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET deve ter pelo menos 32 caracteres.");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function encode(payload: TokenPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token?: string): TokenPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = Buffer.from(sign(body));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload;
    if (!payload.uid || payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setAuthCookie(userId: string, persistent = false) {
  const maxAge = persistent ? 60 * 60 * 24 * 14 : MAX_AGE_SECONDS;
  cookies().set(COOKIE_NAME, encode({ uid: userId, exp: Date.now() + maxAge * 1000 }), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.AUTH_COOKIE_SECURE === "true",
    path: "/",
    maxAge,
  });
}

export function clearAuthCookie() {
  cookies().set(COOKIE_NAME, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
}

async function readCurrentSession(): Promise<AuthSession | null> {
  const payload = decode(cookies().get(COOKIE_NAME)?.value);
  if (!payload) return null;
  const result = await query<SessionRow>(`
    SELECT u.id,u.full_name,u.email,u.job_title,u.unit_id,u.phone,u.avatar_color,u.status,u.last_access_at,u.must_change_password,
           p.id profile_id,
           CASE WHEN p.slug IN ('remetente','secretaria','superior','administracao') THEN p.slug
                WHEN p.access_level='administracao' THEN 'administracao'
                WHEN p.access_level IN ('supervisao','direccao') THEN 'superior'
                ELSE 'remetente' END profile_slug,
           p.name profile_name,p.description profile_description,
           p.access_level,p.scope profile_scope,p.permissions,ou.name unit_name
      FROM users u
      JOIN user_profiles up ON up.user_id=u.id AND up.is_primary=true
      JOIN profiles p ON p.id=up.profile_id AND p.active=true
      JOIN organizational_units ou ON ou.id=u.unit_id
     WHERE u.id=$1 AND u.status='activo'
     LIMIT 1
  `, [payload.uid]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    user: {
      id: row.id,
      nome: row.full_name,
      email: row.email,
      cargo: row.job_title,
      unidadeId: row.unit_id,
      perfilIds: [row.profile_id],
      avatarColor: row.avatar_color,
      estado: row.status,
      ultimoAcesso: row.last_access_at ?? undefined,
      telefone: row.phone ?? undefined,
      precisaAlterarPalavraPasse: row.must_change_password,
    },
    profile: {
      id: row.profile_id,
      nome: row.profile_name,
      descricao: row.profile_description,
      tipoBase: row.profile_slug,
      nivel: row.access_level,
      utilizadoresCount: 1,
      permissoes: row.permissions,
      ambito: row.profile_scope,
      estado: "activo",
    },
    perfilNavegacao: row.profile_slug,
    unitName: row.unit_name,
  };
}

// O layout e a pagina podem validar a sessao durante o mesmo pedido RSC.
// `cache` elimina a segunda consulta sem manter dados de utilizadores entre pedidos.
export const getCurrentSession = cache(readCurrentSession);

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireProfile(...allowed: PerfilNavegacao[]) {
  const session = await requireSession();
  if (!allowed.includes(session.perfilNavegacao)) redirect(`/`);
  return session;
}

export async function requireAdminArea(area: string) {
  const session = await requireProfile("administracao");
  const { hasAdminAreaPermission } = await import("@/lib/permissions");
  if (!hasAdminAreaPermission(session.profile.permissoes, area)) redirect(`/`);
  return session;
}

export async function audit(input: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  ip?: string | null;
  result?: "sucesso" | "falha" | "bloqueado";
}) {
  await query(
    `INSERT INTO audit_logs(user_id,action,entity_type,entity_id,details,ip,result)
     VALUES($1,$2,$3,$4,$5::jsonb,$6::inet,$7)`,
    [input.userId ?? null,input.action,input.entityType,input.entityId,JSON.stringify(input.details ?? {}),input.ip ?? null,input.result ?? "sucesso"]
  );
}
