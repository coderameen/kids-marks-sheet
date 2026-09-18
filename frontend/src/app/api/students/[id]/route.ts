import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { db, rowToObject, studentPayload } from "@/lib/server/db";
import { parseStudentFields } from "@/lib/server/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const student_id = Number(params.id);
  const c = await db();
  const student = await c.execute({
    sql: "SELECT * FROM students WHERE id = ?",
    args: [student_id],
  });
  if (!student.rows.length) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }
  const entries = await c.execute({
    sql: `SELECT * FROM point_entries WHERE student_id = ? ORDER BY entry_date DESC, id DESC`,
    args: [student_id],
  });
  const list = entries.rows.map((r) => rowToObject(r as Record<string, unknown>));
  const total = list.reduce((s, e) => s + Number(e.points), 0);
  const s = studentPayload(
    rowToObject(student.rows[0] as Record<string, unknown>)
  );
  delete s.photo_blob;
  return NextResponse.json({ student: s, entries: list, total_points: total });
}

export async function PUT(req: Request, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const student_id = Number(params.id);
  const data = await req.json().catch(() => ({}));
  const parsed = parseStudentFields(data);
  if (!parsed) {
    return NextResponse.json(
      { error: "Valid full name, nick name, age (3-25), and subject required" },
      { status: 400 }
    );
  }
  const c = await db();
  const exists = await c.execute({
    sql: "SELECT id FROM students WHERE id = ?",
    args: [student_id],
  });
  if (!exists.rows.length) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }
  await c.execute({
    sql: `UPDATE students SET full_name = ?, nick_name = ?, age = ?, subject = ? WHERE id = ?`,
    args: [
      parsed.full_name,
      parsed.nick_name,
      parsed.age,
      parsed.subject,
      student_id,
    ],
  });
  const row = await c.execute({
    sql: "SELECT * FROM students WHERE id = ?",
    args: [student_id],
  });
  const student = studentPayload(
    rowToObject(row.rows[0] as Record<string, unknown>)
  );
  delete student.photo_blob;
  return NextResponse.json({ student });
}
