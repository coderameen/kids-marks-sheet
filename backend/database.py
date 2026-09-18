import aiosqlite
import bcrypt
from pathlib import Path

from config import ADMIN_PASSWORD, ADMIN_USERNAME, DATABASE_PATH
from photos import photo_path, save_photo

BASE_DIR = Path(__file__).resolve().parent
SEED_PHOTO_SARA = BASE_DIR / "seed_assets" / "syeda_sara.png"
SEED_PHOTO_ASRA = BASE_DIR / "seed_assets" / "syeda_asra.png"
SEED_ENTRY_DATE = "2026-09-18"


async def get_db():
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def _migrate(db):
    cursor = await db.execute("PRAGMA table_info(students)")
    cols = {row[1] for row in await cursor.fetchall()}
    if "profile_photo" not in cols:
        await db.execute(
            "ALTER TABLE students ADD COLUMN profile_photo TEXT"
        )


async def _seed_student(
    db,
    *,
    full_name: str,
    nick_name: str,
    age: int,
    subject: str,
    seed_photo: Path,
    points: int,
    questions: int,
    entry_date: str,
):
    cursor = await db.execute(
        "SELECT id FROM students WHERE full_name = ?",
        (full_name,),
    )
    row = await cursor.fetchone()
    if row:
        sid = row["id"]
        await db.execute(
            """
            UPDATE students
            SET nick_name = ?, age = ?, subject = ?
            WHERE id = ?
            """,
            (nick_name, age, subject, sid),
        )
    else:
        cursor = await db.execute(
            """
            INSERT INTO students (full_name, nick_name, age, subject)
            VALUES (?, ?, ?, ?)
            """,
            (full_name, nick_name, age, subject),
        )
        sid = cursor.lastrowid

    if seed_photo.is_file() and photo_path(sid) is None:
        filename = save_photo(sid, seed_photo)
        await db.execute(
            "UPDATE students SET profile_photo = ? WHERE id = ?",
            (filename, sid),
        )

    cursor = await db.execute(
        """
        SELECT id FROM point_entries
        WHERE student_id = ? AND entry_date = ?
        """,
        (sid, entry_date),
    )
    if not await cursor.fetchone():
        await db.execute(
            """
            INSERT INTO point_entries (student_id, points, questions_count, entry_date)
            VALUES (?, ?, ?, ?)
            """,
            (sid, points, questions, entry_date),
        )


async def init_db():
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.executescript(
            """
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
            """
        )
        await _migrate(db)
        cursor = await db.execute(
            "SELECT id FROM admins WHERE username = ?", (ADMIN_USERNAME,)
        )
        row = await cursor.fetchone()
        if not row:
            pw_hash = bcrypt.hashpw(
                ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt()
            ).decode("utf-8")
            await db.execute(
                "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
                (ADMIN_USERNAME, pw_hash),
            )

        await _seed_student(
            db,
            full_name="Syeda Sara",
            nick_name="Saruu ❤️",
            age=6,
            subject="Olympiad exams",
            seed_photo=SEED_PHOTO_SARA,
            points=3,
            questions=3,
            entry_date=SEED_ENTRY_DATE,
        )
        await _seed_student(
            db,
            full_name="Syeda Asra",
            nick_name="Asruu ❤️",
            age=9,
            subject="Olympiad exams",
            seed_photo=SEED_PHOTO_ASRA,
            points=3,
            questions=3,
            entry_date=SEED_ENTRY_DATE,
        )
        await db.commit()


def row_to_dict(row):
    if row is None:
        return None
    return dict(row)


def student_payload(row_dict):
    sid = row_dict["id"]
    has = bool(row_dict.get("profile_photo")) or photo_path(sid) is not None
    row_dict["has_photo"] = has
    return row_dict
