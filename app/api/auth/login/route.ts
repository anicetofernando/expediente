import { NextRequest, NextResponse } from "next/server";
import { audit, setAuthCookie } from "@/lib/auth";
import { query } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { getProfileLandingHref } from "@/components/layout/navigation-model";
import type { PerfilNavegacao } from "@/config/navigation";

interface LoginRow {
  id: string;
  email: string;
  password_hash: string;
  status: string;
  failed_login_attempts: number;
  locked_until: string | null;
  profile_slug: PerfilNavegacao;
}

function requestIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
}

export async function POST(request: NextRequest) {
  const ip = requestIp(request);
  let input: { email?: string; password?: string; persistent?: boolean };
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido invalido." }, { status: 400 });
  }
  const email = input.email?.trim().toLowerCase();
  const password = input.password ?? "";
  if (!email || !password) return NextResponse.json({ error: "Introduza o e-mail e a palavra-passe." }, { status: 400 });

  const result = await query<LoginRow>(`
    SELECT u.id,u.email,u.password_hash,u.status,u.failed_login_attempts,u.locked_until,
           CASE WHEN p.slug IN ('remetente','secretaria','superior','administracao') THEN p.slug
                WHEN p.access_level='administracao' THEN 'administracao'
                WHEN p.access_level IN ('supervisao','direccao') THEN 'superior'
                ELSE 'remetente' END profile_slug
      FROM users u
      JOIN user_profiles up ON up.user_id=u.id AND up.is_primary=true
      JOIN profiles p ON p.id=up.profile_id
     WHERE lower(u.email)=lower($1)
     LIMIT 1
  `, [email]);
  const user = result.rows[0];
  if (!user) {
    await audit({ action: "Tentativa de acesso", entityType: "Sessao", entityId: email, ip, result: "falha", details: { reason: "unknown_user" } });
    return NextResponse.json({ error: "E-mail ou palavra-passe incorrectos." }, { status: 401 });
  }
  if (user.status !== "activo") {
    await audit({ userId: user.id, action: "Tentativa de acesso", entityType: "Sessao", entityId: user.id, ip, result: "bloqueado", details: { reason: user.status } });
    return NextResponse.json({ error: "Esta conta nao esta activa." }, { status: 403 });
  }
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return NextResponse.json({ error: "Conta temporariamente bloqueada. Tente novamente mais tarde." }, { status: 423 });
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    const attempts = user.failed_login_attempts + 1;
    await query(
      `UPDATE users SET failed_login_attempts=$2,locked_until=CASE WHEN $2>=5 THEN now()+interval '15 minutes' ELSE NULL END WHERE id=$1`,
      [user.id, attempts]
    );
    await audit({ userId: user.id, action: "Tentativa de acesso", entityType: "Sessao", entityId: user.id, ip, result: attempts >= 5 ? "bloqueado" : "falha", details: { attempts } });
    return NextResponse.json({ error: attempts >= 5 ? "Conta bloqueada durante 15 minutos." : "E-mail ou palavra-passe incorrectos." }, { status: 401 });
  }

  await query("UPDATE users SET failed_login_attempts=0,locked_until=NULL,last_access_at=now() WHERE id=$1", [user.id]);
  setAuthCookie(user.id, input.persistent === true);
  await audit({ userId: user.id, action: "Sessao iniciada", entityType: "Sessao", entityId: user.id, ip });
  return NextResponse.json({ ok: true, redirectTo: getProfileLandingHref(user.profile_slug) });
}
