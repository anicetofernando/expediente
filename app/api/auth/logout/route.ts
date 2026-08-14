import { NextRequest, NextResponse } from "next/server";
import { audit, clearAuthCookie, getCurrentSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (session) {
    await audit({
      userId: session.user.id,
      action: "Sessao terminada",
      entityType: "Sessao",
      entityId: session.user.id,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });
  }
  clearAuthCookie();
  return NextResponse.json({ ok: true });
}
