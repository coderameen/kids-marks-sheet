import { createClient, type Client } from "@libsql/client";
import fs from "fs";
import path from "path";
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
} from "@/lib/server/config";
import { hashPassword } from "@/lib/server/auth";

const SEED_DATE = "2026-09-18";

let client: Client | null = null;
let initPromise: Promise<void> | null = null;

function getClient() {
  if (!client) {
    const url =
      process.env.TURSO_DATABASE_URL ||
      process.env.LIBSQL_URL ||
      `file:${path.join(process.cwd(), "data", "marks.db")}`;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    client = createClient(
      authToken ? { url, authToken } : { url }
    );
  }
  return client;
}

function rowToObject(row: Record<string, unknown>) {
  return { ...row };
}

export function studentPayload(
  row: Record<string, unknown>
): Record<string, unknown> {
  const has =
    row.photo_blob != null ||
    (typeof row.profile_photo === "string" && row.profile_photo.length > 0);
  return { ...row, has_photo: has };
}

async function migrate(c: Client) {
  const info = await c.execute("PRAGMA table_info(students)");
  const cols = new Set(info.rows.map((r) => String(r.name)));
  if (!cols.has("profile_photo")) {
    await c.execute("ALTER TABLE students ADD COLUMN profile_photo TEXT");
  }
  if (!cols.has("photo_blob")) {
    await c.execute("ALTER TABLE students ADD COLUMN photo_blob BLOB");
  }
  if (!cols.has("photo_mime")) {
    await c.execute("ALTER TABLE students ADD COLUMN photo_mime TEXT");
  }
}

async function loadPhotoFile(filename: string) {
  const candidates = [
    path.join(process.cwd(), "public", "seed", filename),
    path.join(process.cwd(), "..", "backend", "seed_assets", filename),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return {
        data: fs.readFileSync(p),
        mime: "image/png",
      };
    }
  }
  return null;
}

async function seedStudent(
  c: Client,
  opts: {
    full_name: string;
    nick_name: string;
    age: number;
    subject: string;
    photoFile: string;
    points: number;
    questions: number;
  }
) {
  const existing = await c.execute({
    sql: "SELECT id FROM students WHERE full_name = ?",
    args: [opts.full_name],
  });
  let sid: number;
  if (existing.rows.length) {
    sid = Number(existing.rows[0].id);
    await c.execute({
      sql: "UPDATE students SET nick_name = ?, age = ?, subject = ? WHERE id = ?",
      args: [opts.nick_name, opts.age, opts.subject, sid],
    });
  } else {
    const ins = await c.execute({
      sql: `INSERT INTO students (full_name, nick_name, age, subject) VALUES (?, ?, ?, ?)`,
      args: [opts.full_name, opts.nick_name, opts.age, opts.subject],
    });
    sid = Number(ins.lastInsertRowid);
  }

  const photoRow = await c.execute({
    sql: "SELECT photo_blob FROM students WHERE id = ?",
    args: [sid],
  });
  if (photoRow.rows[0]?.photo_blob == null) {
    const file = await loadPhotoFile(opts.photoFile);
    if (file) {
      await c.execute({
        sql: "UPDATE students SET photo_blob = ?, photo_mime = ?, profile_photo = ? WHERE id = ?",
        args: [file.data, file.mime, opts.photoFile, sid],
      });
    }
  }

  const pe = await c.execute({
    sql: "SELECT id FROM point_entries WHERE student_id = ? AND entry_date = ?",
    args: [sid, SEED_DATE],
  });
  if (!pe.rows.length) {
    await c.execute({
      sql: `INSERT INTO point_entries (student_id, points, questions_count, entry_date)
            VALUES (?, ?, ?, ?)`,
      args: [sid, opts.points, opts.questions, SEED_DATE],
    });
  }
}

export async function ensureDb() {
  if (!initPromise) {
    initPromise = (async () => {
      const c = getClient();
      await c.executeMultiple(`
        CREATE TABLE IF NOT EXISTS admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name TEXT NOT NULL,
          nick_name TEXT NOT NULL,
          age INTEGER NOT NULL,
          subject TEXT NOT NULL,
          profile_photo TEXT,
          photo_blob BLOB,
          photo_mime TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS point_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL,
          points INTEGER NOT NULL CHECK (points >= 0),
          questions_count INTEGER NOT NULL DEFAULT 1,
          entry_date TEXT NOT NULL,
          note TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_point_entries_student ON point_entries(student_id);
        CREATE INDEX IF NOT EXISTS idx_point_entries_date ON point_entries(entry_date);
      `);
      await migrate(c);

      const admin = await c.execute({
        sql: "SELECT id FROM admins WHERE username = ?",
        args: [ADMIN_USERNAME],
      });
      if (!admin.rows.length) {
        const pw = await hashPassword(ADMIN_PASSWORD);
        await c.execute({
          sql: "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
          args: [ADMIN_USERNAME, pw],
        });
      }

      await seedStudent(c, {
        full_name: "Syeda Sara",
        nick_name: "Saruu ❤️",
        age: 6,
        subject: "Olympiad exams",
        photoFile: "syeda_sara.png",
        points: 3,
        questions: 3,
      });
      await seedStudent(c, {
        full_name: "Syeda Asra",
        nick_name: "Asruu ❤️",
        age: 9,
        subject: "Olympiad exams",
        photoFile: "syeda_asra.png",
        points: 3,
        questions: 3,
      });
    })();
  }
  await initPromise;
}

export async function db() {
  await ensureDb();
  return getClient();
}

export { rowToObject, SEED_DATE };
