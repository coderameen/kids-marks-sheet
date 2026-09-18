import { NextResponse } from "next/server";
import { ensureDb, postgresConnectionString } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDb();
    return NextResponse.json({
      status: "ok",
      database: postgresConnectionString() ? "postgres" : "sqlite",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ status: "error", message }, { status: 503 });
  }
}
