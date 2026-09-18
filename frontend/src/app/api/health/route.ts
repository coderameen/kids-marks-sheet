import { NextResponse } from "next/server";
import {
  ensureDb,
  isBundledReadOnlyDb,
  postgresConnectionString,
} from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDb();
    const pg = postgresConnectionString();
    const mode = pg
      ? "postgres"
      : isBundledReadOnlyDb()
        ? "sqlite-readonly"
        : "sqlite";
    return NextResponse.json({ status: "ok", database: mode });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ status: "error", message }, { status: 503 });
  }
}
