import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

const KEY = "771e96670bd985d18b12841d57202572";

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("key") !== KEY) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    await query("ALTER TABLE documents ADD COLUMN IF NOT EXISTS decision_note jsonb");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
