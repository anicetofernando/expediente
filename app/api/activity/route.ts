import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { listTimeline } from "@/lib/expedients-db";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  return NextResponse.json({ items: await listTimeline(session) });
}
