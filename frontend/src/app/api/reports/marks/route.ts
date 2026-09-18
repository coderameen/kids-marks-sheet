import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { periodStart } from "@/lib/server/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const url = new URL(req.url);
  const period = (url.searchParams.get("period") || "monthly").toLowerCase();
  if (!["weekly", "monthly", "yearly"].includes(period)) {
    return NextResponse.json(
      { error: "period must be weekly, monthly, or yearly" },
      { status: 400 }
    );
  }
  const start = periodStart(period);
  const c = await db();
  const result = await c.execute({
    sql: `
      SELECT s.id AS student_id, s.full_name, s.nick_name, s.age, s.subject,
             p.entry_date, p.questions_count, p.points, p.note
      FROM point_entries p
      JOIN students s ON s.id = p.student_id
      WHERE date(p.entry_date) >= date(?)
      ORDER BY s.full_name, p.entry_date, p.id
    `,
    args: [start],
  });
  let total_points = 0;
  const entries = result.rows.map((r) => {
    const pts = Number(r.points);
    total_points += pts;
    return {
      student_id: Number(r.student_id),
      full_name: r.full_name,
      nick_name: r.nick_name,
      age: r.age,
      subject: r.subject,
      entry_date: r.entry_date,
      questions_count: Number(r.questions_count),
      points: pts,
      note: r.note || "",
    };
  });
  return NextResponse.json({
    period,
    from_date: start,
    to_date: new Date().toISOString().slice(0, 10),
    entries,
    entry_count: entries.length,
    total_points,
  });
}
