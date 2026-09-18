import { NextResponse } from "next/server";
import {
  ensureDb,
  isBundledReadOnlyDb,
  postgresConnectionString,
  postgresEnvHints,
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
    const body: Record<string, unknown> = {
      status: "ok",
      database: mode,
      env: postgresEnvHints(),
    };
    if (mode === "sqlite-readonly" && process.env.VERCEL === "1") {
      body.hint =
        "Neon is not visible to this deployment yet. In Vercel: Storage → confirm DB is connected to olympiad-exams → Settings → Environment Variables (DATABASE_URL or POSTGRES_URL) → Deployments → Redeploy.";
    }
    return NextResponse.json(body);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json(
      { status: "error", message, env: postgresEnvHints() },
      { status: 503 }
    );
  }
}
