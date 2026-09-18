import { createClient, type Client, type InValue } from "@libsql/client";
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import os from "os";
import path from "path";
import { ADMIN_PASSWORD, ADMIN_USERNAME } from "@/lib/server/config";
import { hashPassword } from "@/lib/server/auth";

export const SEED_DATE = "2026-09-18";

const WRITE_SQL = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|REPLACE)/i;

let sqlite: Client | null = null;
let pgSql: ReturnType<typeof neon> | null = null;
let initPromise: Promise<void> | null = null;

/** Vercel Storage / Neon may inject any of these names. */
export function postgresConnectionString(): string | undefined {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL
  );
}

function isVercelRuntime() {
  return process.env.VERCEL === "1";
}

function shouldUsePostgres() {
  return Boolean(postgresConnectionString());
}

/** Live site without Postgres: read bundled marks.db (login + leaderboard work). */
export function isBundledReadOnlyDb() {
  return isVercelRuntime() && !shouldUsePostgres();
}

export function assertDbWritable() {
  if (isBundledReadOnlyDb()) {
    throw new Error(
      "To save changes for all devices, connect Postgres in Vercel (Storage → Postgres → this project) and redeploy."
    );
  }
}

function getPg() {
  const url = postgresConnectionString();
  if (!url) return null;
  if (!pgSql) {
    pgSql = neon(url, { fullResults: true });
  }
  return pgSql;
}

function bundledDbSourcePath() {
  return path.join(process.cwd(), "data", "marks.db");
}

/** On Vercel, copy bundled DB to /tmp so SQLite can open the file reliably. */
function sqliteFilePath() {
  if (!isBundledReadOnlyDb()) {
    return bundledDbSourcePath();
  }
  const src = bundledDbSourcePath();
  const dest = path.join(os.tmpdir(), "olympiad-marks.db");
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
  }
  return dest;
}

function getSqlite() {
  if (!sqlite) {
    sqlite = createClient({ url: `file:${sqliteFilePath()}` });
  }
  return sqlite;
}

function toPgParams(query: string, args: unknown[]) {
  let n = 0;
  const text = query.replace(/\?/g, () => `$${++n}`);
  return { text, args };
}

export type DbResult = {
  rows: Record<string, unknown>[];
  lastInsertRowid?: number;
};

async function rawExecute(
  query: string,
  args: unknown[] = [],
  opts?: { allowWrite?: boolean }
): Promise<DbResult> {
  if (!opts?.allowWrite && WRITE_SQL.test(query.trim())) {
    assertDbWritable();
  }

  const pg = getPg();
  if (pg && shouldUsePostgres()) {
    const isInsert = /^\s*INSERT/i.test(query.trim());
    const pgParams = toPgParams(query, args);
    let text = pgParams.text;
    const pgArgs = pgParams.args;
    if (isInsert && !/RETURNING/i.test(text)) {
      text = `${text.replace(/;\s*$/, "")} RETURNING id`;
    }
    const result = await pg(text, pgArgs as never[]);
    const rows = (
      Array.isArray(result)
        ? result
        : "rows" in result && Array.isArray(result.rows)
          ? result.rows
          : []
    ) as Record<string, unknown>[];
    return {
      rows,
      lastInsertRowid:
        rows[0]?.id != null ? Number(rows[0].id) : undefined,
    };
  }

  const r = await getSqlite().execute({
    sql: query,
    args: args as InValue[],
  });
  return {
    rows: r.rows as Record<string, unknown>[],
    lastInsertRowid: Number(r.lastInsertRowid) || undefined,
  };
}

export async function dbExecute(
  query: string,
  args: unknown[] = []
): Promise<DbResult> {
  await ensureDb();
  return rawExecute(query, args);
}

export function rowToObject(row: Record<string, unknown>) {
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

async function loadPhotoFile(filename: string) {
  const candidates = [
    path.join(process.cwd(), "public", "seed", filename),
    path.join(process.cwd(), "..", "backend", "seed_assets", filename),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return { data: fs.readFileSync(p), mime: "image/png" };
    }
  }
  return null;
}

async function seedStudent() {
  const seeds = [
    {
      full_name: "Syeda Sara",
      nick_name: "Saruu ❤️",
      age: 6,
      subject: "Olympiad exams",
      photoFile: "syeda_sara.png",
      points: 3,
      questions: 3,
    },
    {
      full_name: "Syeda Asra",
      nick_name: "Asruu ❤️",
      age: 9,
      subject: "Olympiad exams",
      photoFile: "syeda_asra.png",
      points: 3,
      questions: 3,
    },
  ] as const;

  for (const opts of seeds) {
    const existing = await rawExecute(
      "SELECT id FROM students WHERE full_name = ?",
      [opts.full_name]
    );
    let sid: number;
    if (existing.rows.length) {
      sid = Number(existing.rows[0].id);
      await rawExecute(
        "UPDATE students SET nick_name = ?, age = ?, subject = ? WHERE id = ?",
        [opts.nick_name, opts.age, opts.subject, sid],
        { allowWrite: true }
      );
    } else {
      const ins = await rawExecute(
        "INSERT INTO students (full_name, nick_name, age, subject) VALUES (?, ?, ?, ?)",
        [opts.full_name, opts.nick_name, opts.age, opts.subject],
        { allowWrite: true }
      );
      sid = Number(ins.lastInsertRowid);
    }

    const photoRow = await rawExecute(
      "SELECT photo_blob FROM students WHERE id = ?",
      [sid]
    );
    if (photoRow.rows[0]?.photo_blob == null) {
      const file = await loadPhotoFile(opts.photoFile);
      if (file) {
        await rawExecute(
          "UPDATE students SET photo_blob = ?, photo_mime = ?, profile_photo = ? WHERE id = ?",
          [file.data, file.mime, opts.photoFile, sid],
          { allowWrite: true }
        );
      }
    }

    const pe = await rawExecute(
      "SELECT id FROM point_entries WHERE student_id = ? AND entry_date = ?",
      [sid, SEED_DATE]
    );
    if (!pe.rows.length) {
      await rawExecute(
        `INSERT INTO point_entries (student_id, points, questions_count, entry_date)
         VALUES (?, ?, ?, ?)`,
        [sid, opts.points, opts.questions, SEED_DATE],
        { allowWrite: true }
      );
    }
  }
}

async function initPostgres() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      nick_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      subject TEXT NOT NULL,
      profile_photo TEXT,
      photo_blob BYTEA,
      photo_mime TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS point_entries (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      points INTEGER NOT NULL CHECK (points >= 0),
      questions_count INTEGER NOT NULL DEFAULT 1,
      entry_date TEXT NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_point_entries_student ON point_entries(student_id)`,
    `CREATE INDEX IF NOT EXISTS idx_point_entries_date ON point_entries(entry_date)`,
  ];
  const pg = getPg();
  if (!pg) throw new Error("Postgres URL missing");
  for (const s of statements) {
    await pg(s);
  }
}

async function initSqlite() {
  const c = getSqlite();
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
}

export async function ensureDb() {
  if (initPromise) {
    await initPromise;
    return;
  }
  initPromise = (async () => {
    if (isBundledReadOnlyDb()) {
      if (!fs.existsSync(bundledDbSourcePath())) {
        throw new Error("Database file missing on server.");
      }
      sqliteFilePath();
      return;
    }

    if (shouldUsePostgres()) {
      await initPostgres();
    } else {
      await initSqlite();
    }

    const admin = await rawExecute(
      "SELECT id FROM admins WHERE username = ?",
      [ADMIN_USERNAME]
    );
    if (!admin.rows.length) {
      const pw = await hashPassword(ADMIN_PASSWORD);
      await rawExecute(
        "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
        [ADMIN_USERNAME, pw],
        { allowWrite: true }
      );
    }

    await seedStudent();
  })();
  await initPromise;
}

export async function db() {
  await ensureDb();
  return {
    execute: (
      queryOrOpts: string | { sql: string; args?: unknown[] }
    ): Promise<DbResult> => {
      if (typeof queryOrOpts === "string") {
        return dbExecute(queryOrOpts);
      }
      return dbExecute(queryOrOpts.sql, queryOrOpts.args ?? []);
    },
  };
}
