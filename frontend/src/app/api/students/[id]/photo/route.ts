import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { db, rowToObject, studentPayload } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(_req: Request, { params }: Ctx) {
  const student_id = Number(params.id);
  const c = await db();
  const row = await c.execute({
    sql: "SELECT photo_blob, photo_mime FROM students WHERE id = ?",
    args: [student_id],
  });
  if (!row.rows.length) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }
  const blob = row.rows[0].photo_blob;
  if (blob == null) {
    return NextResponse.json({ error: "No photo" }, { status: 404 });
  }
  const mime = String(row.rows[0].photo_mime || "image/png");
  const body = Buffer.from(new Uint8Array(blob as ArrayBufferLike));
  return new NextResponse(body, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function POST(req: Request, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const student_id = Number(params.id);
  const form = await req.formData();
  const file = form.get("photo");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Photo file required" }, { status: 400 });
  }
  const name = file.name.toLowerCase();
  const ext = name.slice(name.lastIndexOf("."));
  if (!MIME[ext]) {
    return NextResponse.json(
      { error: "Use JPG, PNG, WEBP, or GIF" },
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
  const buf = Buffer.from(await file.arrayBuffer());
  await c.execute({
    sql: `UPDATE students SET photo_blob = ?, photo_mime = ?, profile_photo = ? WHERE id = ?`,
    args: [buf, MIME[ext], file.name, student_id],
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

export async function DELETE(req: Request, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const student_id = Number(params.id);
  const c = await db();
  const exists = await c.execute({
    sql: "SELECT id FROM students WHERE id = ?",
    args: [student_id],
  });
  if (!exists.rows.length) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }
  await c.execute({
    sql: `UPDATE students SET photo_blob = NULL, photo_mime = NULL, profile_photo = NULL WHERE id = ?`,
    args: [student_id],
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
