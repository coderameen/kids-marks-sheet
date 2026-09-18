import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { db, rowToObject } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string; entryId: string } };

export async function PUT(req: Request, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const student_id = Number(params.id);
  const entry_id = Number(params.entryId);
  const data = await req.json().catch(() => ({}));
  let points = parseInt(String(data.points), 10);
  let questions_count = parseInt(String(data.questions_count ?? 1), 10);
  if (Number.isNaN(points) || Number.isNaN(questions_count)) {
    return NextResponse.json(
      { error: "Points and questions must be numbers" },
      { status: 400 }
    );
  }
  if (points < 0) points = 0;
  if (questions_count < 1) questions_count = 1;
  const entry_date = String(data.entry_date || "").trim();
  if (!entry_date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }
  const note = String(data.note || "").trim() || null;

  const c = await db();
  const exists = await c.execute({
    sql: "SELECT id FROM point_entries WHERE id = ? AND student_id = ?",
    args: [entry_id, student_id],
  });
  if (!exists.rows.length) {
    return NextResponse.json({ error: "Point entry not found" }, { status: 404 });
  }
  await c.execute({
    sql: `UPDATE point_entries SET points = ?, questions_count = ?, entry_date = ?, note = ?
          WHERE id = ? AND student_id = ?`,
    args: [points, questions_count, entry_date, note, entry_id, student_id],
  });
  const entryRow = await c.execute({
    sql: "SELECT * FROM point_entries WHERE id = ?",
    args: [entry_id],
  });
  const totalRow = await c.execute({
    sql: "SELECT COALESCE(SUM(points), 0) AS total FROM point_entries WHERE student_id = ?",
    args: [student_id],
  });
  return NextResponse.json({
    entry: rowToObject(entryRow.rows[0] as Record<string, unknown>),
    total_points: Number(totalRow.rows[0].total),
  });
}
