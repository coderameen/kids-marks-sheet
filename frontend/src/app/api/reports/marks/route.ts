import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { periodStart, todayUtc } from "@/lib/period";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const period = (url.searchParams.get("period") || "monthly").toLowerCase();
  if (!["weekly", "monthly", "yearly"].includes(period)) {
    return NextResponse.json(
      { error: "period must be weekly, monthly, or yearly" },
      { status: 400 }
    );
  }
  const start = periodStart(period);
  if (!start) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const studentParam = url.searchParams.get("student_id");
  const studentId = studentParam ? Number(studentParam) : null;

  // ISO YYYY-MM-DD strings compare correctly — avoid SQLite-only date() on Postgres
  const c = await db();
  const result = await c.execute({
    sql:
      studentId != null && !Number.isNaN(studentId)
        ? `
      SELECT s.id AS student_id, s.full_name, s.nick_name, s.age, s.subject,
             p.id AS entry_id, p.entry_date, p.questions_count, p.points, p.note
      FROM point_entries p
      JOIN students s ON s.id = p.student_id
      WHERE p.student_id = ? AND p.entry_date >= ?
      ORDER BY p.entry_date, p.id
    `
        : `
      SELECT s.id AS student_id, s.full_name, s.nick_name, s.age, s.subject,
             p.id AS entry_id, p.entry_date, p.questions_count, p.points, p.note
      FROM point_entries p
      JOIN students s ON s.id = p.student_id
      WHERE p.entry_date >= ?
      ORDER BY s.full_name, p.entry_date, p.id
    `,
    args:
      studentId != null && !Number.isNaN(studentId)
        ? [studentId, start]
        : [start],
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
      entry_id: Number(r.entry_id),
      entry_date: String(r.entry_date),
      questions_count: Number(r.questions_count),
      points: pts,
      note: r.note || "",
    };
  });

  return NextResponse.json(
    {
      period,
      from_date: start,
      to_date: todayUtc(),
      entries,
      entry_count: entries.length,
      total_points,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
    }
  );
}
