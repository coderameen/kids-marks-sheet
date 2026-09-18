import { NextResponse } from "next/server";
import { createToken, verifyPassword } from "@/lib/server/auth";
import { apiError } from "@/lib/server/apiRoute";
import { db } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const data = await req.json().catch(() => ({}));
    const username = String(data.username || "").trim();
    const password = String(data.password || "");
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }
    const c = await db();
    const row = await c.execute({
      sql: "SELECT id, username, password_hash FROM admins WHERE username = ?",
      args: [username],
    });
    if (!row.rows.length) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const admin = row.rows[0];
    const ok = await verifyPassword(
      password,
      String(admin.password_hash)
    );
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const token = await createToken(Number(admin.id), String(admin.username));
    return NextResponse.json({ token, username: admin.username });
  } catch (e) {
    return apiError(e, "login");
  }
}
