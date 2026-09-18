import { NextResponse } from "next/server";
import { db, rowToObject, studentPayload } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const c = await db();
  const result = await c.execute(`
    SELECT s.id, s.full_name, s.nick_name, s.age, s.subject, s.profile_photo, s.photo_blob,
           COALESCE(SUM(p.points), 0) AS total_points,
           COUNT(p.id) AS sessions_count
    FROM students s
    LEFT JOIN point_entries p ON p.student_id = s.id
    GROUP BY s.id
    ORDER BY total_points DESC, s.full_name ASC
  `);
  const rows = result.rows;
  const board: Record<string, unknown>[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const pts = Number(r.total_points);
    let rank: number;
    if (i === 0) rank = 1;
    else if (pts === Number(rows[i - 1].total_points)) {
      rank = Number(board[i - 1].rank);
    } else rank = i + 1;
    const entry = studentPayload(rowToObject(r as Record<string, unknown>));
    board.push({
      rank,
      id: entry.id,
      full_name: entry.full_name,
      nick_name: entry.nick_name,
      age: entry.age,
      subject: entry.subject,
      has_photo: entry.has_photo,
      total_points: pts,
      sessions_count: Number(r.sessions_count),
    });
  }
  return NextResponse.json({ leaderboard: board });
}
