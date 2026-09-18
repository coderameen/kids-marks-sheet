import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { db, rowToObject, studentPayload } from "@/lib/server/db";
import { parseStudentFields } from "@/lib/server/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const c = await db();
  const result = await c.execute(`
    SELECT s.*,
           COALESCE(SUM(p.points), 0) AS total_points,
           COUNT(p.id) AS entry_count
    FROM students s
    LEFT JOIN point_entries p ON p.student_id = s.id
    GROUP BY s.id
    ORDER BY total_points DESC, s.full_name ASC
  `);
  const students = result.rows.map((r) => {
    const d = studentPayload(rowToObject(r as Record<string, unknown>));
    d.total_points = Number(d.total_points);
    d.entry_count = Number(d.entry_count);
    delete d.photo_blob;
    return d;
  });
  return NextResponse.json({ students });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const data = await req.json().catch(() => ({}));
  const parsed = parseStudentFields(data);
  if (!parsed) {
    return NextResponse.json(
      { error: "Valid full name, nick name, age (3-25), and subject required" },
      { status: 400 }
    );
  }
  const c = await db();
  const ins = await c.execute({
    sql: `INSERT INTO students (full_name, nick_name, age, subject) VALUES (?, ?, ?, ?)`,
    args: [parsed.full_name, parsed.nick_name, parsed.age, parsed.subject],
  });
  const row = await c.execute({
    sql: "SELECT * FROM students WHERE id = ?",
    args: [Number(ins.lastInsertRowid)],
  });
  const student = studentPayload(
    rowToObject(row.rows[0] as Record<string, unknown>)
  );
  delete student.photo_blob;
  return NextResponse.json({ student }, { status: 201 });
}
