import asyncio
from datetime import datetime, timedelta, timezone

from pathlib import Path

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

from auth import create_token, require_admin, verify_password
from config import CORS_ORIGINS
from database import get_db, init_db, row_to_dict, student_payload
from photos import delete_photo, mime_for_path, photo_path, save_photo

app = Flask(__name__)
CORS(app, origins=CORS_ORIGINS, supports_credentials=True)


def run_async(coro):
    return asyncio.run(coro)


_db_ready = False


@app.before_request
def ensure_db():
    global _db_ready
    if not _db_ready:
        asyncio.run(init_db())
        _db_ready = True


@app.route("/api/health", methods=["GET"])
async def health():
    return jsonify({"status": "ok"})


@app.route("/api/auth/login", methods=["POST"])
async def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, username, password_hash FROM admins WHERE username = ?",
            (username,),
        )
        row = await cursor.fetchone()
        if not row or not verify_password(password, row["password_hash"]):
            return jsonify({"error": "Invalid credentials"}), 401
        token = create_token(row["id"], row["username"])
        return jsonify({"token": token, "username": row["username"]})
    finally:
        await db.close()


@app.route("/api/students", methods=["GET"])
async def list_students():
    db = await get_db()
    try:
        cursor = await db.execute(
            """
            SELECT s.*,
                   COALESCE(SUM(p.points), 0) AS total_points,
                   COUNT(p.id) AS entry_count
            FROM students s
            LEFT JOIN point_entries p ON p.student_id = s.id
            GROUP BY s.id
            ORDER BY total_points DESC, s.full_name ASC
            """
        )
        rows = await cursor.fetchall()
        students = []
        for r in rows:
            d = row_to_dict(r)
            d["total_points"] = int(d["total_points"])
            d["entry_count"] = int(d["entry_count"])
            students.append(student_payload(d))
        return jsonify({"students": students})
    finally:
        await db.close()


@app.route("/api/students", methods=["POST"])
@require_admin
async def create_student():
    data = request.get_json(silent=True) or {}
    parsed = _parse_student_fields(data)
    if not parsed:
        return jsonify({"error": "Valid full name, nick name, age (3-25), and subject required"}), 400
    full_name, nick_name, age, subject = parsed

    db = await get_db()
    try:
        cursor = await db.execute(
            """
            INSERT INTO students (full_name, nick_name, age, subject)
            VALUES (?, ?, ?, ?)
            """,
            (full_name, nick_name, age, subject),
        )
        await db.commit()
        sid = cursor.lastrowid
        cursor = await db.execute("SELECT * FROM students WHERE id = ?", (sid,))
        return jsonify({"student": student_payload(row_to_dict(await cursor.fetchone()))}), 201
    finally:
        await db.close()


def _parse_student_fields(data):
    full_name = (data.get("full_name") or "").strip()
    nick_name = (data.get("nick_name") or "").strip()
    subject = (data.get("subject") or "").strip()
    try:
        age = int(data.get("age"))
    except (TypeError, ValueError):
        age = None
    if not full_name or not nick_name or not subject or age is None or age < 3 or age > 25:
        return None
    return full_name, nick_name, age, subject


@app.route("/api/students/<int:student_id>", methods=["PUT"])
@require_admin
async def update_student(student_id):
    data = request.get_json(silent=True) or {}
    parsed = _parse_student_fields(data)
    if not parsed:
        return jsonify({"error": "Valid full name, nick name, age (3-25), and subject required"}), 400
    full_name, nick_name, age, subject = parsed

    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM students WHERE id = ?", (student_id,))
        if not await cursor.fetchone():
            return jsonify({"error": "Student not found"}), 404
        await db.execute(
            """
            UPDATE students
            SET full_name = ?, nick_name = ?, age = ?, subject = ?
            WHERE id = ?
            """,
            (full_name, nick_name, age, subject, student_id),
        )
        await db.commit()
        cursor = await db.execute("SELECT * FROM students WHERE id = ?", (student_id,))
        return jsonify({"student": student_payload(row_to_dict(await cursor.fetchone()))})
    finally:
        await db.close()


@app.route("/api/students/<int:student_id>", methods=["GET"])
async def get_student(student_id):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM students WHERE id = ?", (student_id,))
        student = await cursor.fetchone()
        if not student:
            return jsonify({"error": "Student not found"}), 404
        cursor = await db.execute(
            """
            SELECT * FROM point_entries
            WHERE student_id = ?
            ORDER BY entry_date DESC, id DESC
            """,
            (student_id,),
        )
        entries = [row_to_dict(r) for r in await cursor.fetchall()]
        total = sum(e["points"] for e in entries)
        return jsonify(
            {
                "student": student_payload(row_to_dict(student)),
                "entries": entries,
                "total_points": total,
            }
        )
    finally:
        await db.close()


@app.route("/api/students/<int:student_id>/photo", methods=["GET"])
async def get_student_photo(student_id):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM students WHERE id = ?", (student_id,))
        if not await cursor.fetchone():
            return jsonify({"error": "Student not found"}), 404
    finally:
        await db.close()
    path = photo_path(student_id)
    if not path:
        return jsonify({"error": "No photo"}), 404
    return send_file(path, mimetype=mime_for_path(path), max_age=3600)


@app.route("/api/students/<int:student_id>/photo", methods=["POST"])
@require_admin
async def upload_student_photo(student_id):
    if "photo" not in request.files:
        return jsonify({"error": "Photo file required"}), 400
    file = request.files["photo"]
    if not file or not file.filename:
        return jsonify({"error": "Photo file required"}), 400

    ext = Path(secure_filename(file.filename)).suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        return jsonify({"error": "Use JPG, PNG, WEBP, or GIF"}), 400

    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM students WHERE id = ?", (student_id,))
        if not await cursor.fetchone():
            return jsonify({"error": "Student not found"}), 404

        from config import UPLOAD_DIR

        tmp_path = UPLOAD_DIR / f"_tmp_{student_id}{ext}"
        file.save(str(tmp_path))
        filename = save_photo(student_id, tmp_path)
        if tmp_path.is_file():
            tmp_path.unlink(missing_ok=True)

        await db.execute(
            "UPDATE students SET profile_photo = ? WHERE id = ?",
            (filename, student_id),
        )
        await db.commit()
        cursor = await db.execute("SELECT * FROM students WHERE id = ?", (student_id,))
        return jsonify({"student": student_payload(row_to_dict(await cursor.fetchone()))})
    finally:
        await db.close()


@app.route("/api/students/<int:student_id>/photo", methods=["DELETE"])
@require_admin
async def remove_student_photo(student_id):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM students WHERE id = ?", (student_id,))
        if not await cursor.fetchone():
            return jsonify({"error": "Student not found"}), 404
        delete_photo(student_id)
        await db.execute(
            "UPDATE students SET profile_photo = NULL WHERE id = ?",
            (student_id,),
        )
        await db.commit()
        cursor = await db.execute("SELECT * FROM students WHERE id = ?", (student_id,))
        return jsonify({"student": student_payload(row_to_dict(await cursor.fetchone()))})
    finally:
        await db.close()


@app.route("/api/students/<int:student_id>/points", methods=["POST"])
@require_admin
async def add_points(student_id):
    data = request.get_json(silent=True) or {}
    try:
        points = int(data.get("points"))
        questions_count = int(data.get("questions_count", 1))
    except (TypeError, ValueError):
        return jsonify({"error": "Points and questions must be numbers"}), 400

    if points < 0:
        points = 0
    if questions_count < 1:
        questions_count = 1

    entry_date = (data.get("entry_date") or "").strip()
    if not entry_date:
        entry_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    note = (data.get("note") or "").strip() or None

    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM students WHERE id = ?", (student_id,))
        if not await cursor.fetchone():
            return jsonify({"error": "Student not found"}), 404
        cursor = await db.execute(
            """
            INSERT INTO point_entries (student_id, points, questions_count, entry_date, note)
            VALUES (?, ?, ?, ?, ?)
            """,
            (student_id, points, questions_count, entry_date, note),
        )
        await db.commit()
        eid = cursor.lastrowid
        cursor = await db.execute("SELECT * FROM point_entries WHERE id = ?", (eid,))
        entry = row_to_dict(await cursor.fetchone())
        cursor = await db.execute(
            "SELECT COALESCE(SUM(points), 0) AS total FROM point_entries WHERE student_id = ?",
            (student_id,),
        )
        total = (await cursor.fetchone())["total"]
        return jsonify({"entry": entry, "total_points": int(total)}), 201
    finally:
        await db.close()


@app.route("/api/students/<int:student_id>/points/<int:entry_id>", methods=["PUT"])
@require_admin
async def update_points(student_id, entry_id):
    data = request.get_json(silent=True) or {}
    try:
        points = int(data.get("points"))
        questions_count = int(data.get("questions_count", 1))
    except (TypeError, ValueError):
        return jsonify({"error": "Points and questions must be numbers"}), 400

    if points < 0:
        points = 0
    if questions_count < 1:
        questions_count = 1

    entry_date = (data.get("entry_date") or "").strip()
    if not entry_date:
        return jsonify({"error": "Date is required"}), 400
    note = (data.get("note") or "").strip() or None

    db = await get_db()
    try:
        cursor = await db.execute(
            """
            SELECT id FROM point_entries
            WHERE id = ? AND student_id = ?
            """,
            (entry_id, student_id),
        )
        if not await cursor.fetchone():
            return jsonify({"error": "Point entry not found"}), 404
        await db.execute(
            """
            UPDATE point_entries
            SET points = ?, questions_count = ?, entry_date = ?, note = ?
            WHERE id = ? AND student_id = ?
            """,
            (points, questions_count, entry_date, note, entry_id, student_id),
        )
        await db.commit()
        cursor = await db.execute("SELECT * FROM point_entries WHERE id = ?", (entry_id,))
        entry = row_to_dict(await cursor.fetchone())
        cursor = await db.execute(
            "SELECT COALESCE(SUM(points), 0) AS total FROM point_entries WHERE student_id = ?",
            (student_id,),
        )
        total = (await cursor.fetchone())["total"]
        return jsonify({"entry": entry, "total_points": int(total)})
    finally:
        await db.close()


@app.route("/api/leaderboard", methods=["GET"])
async def leaderboard():
    db = await get_db()
    try:
        cursor = await db.execute(
            """
            SELECT s.id, s.full_name, s.nick_name, s.age, s.subject, s.profile_photo,
                   COALESCE(SUM(p.points), 0) AS total_points,
                   COUNT(p.id) AS sessions_count
            FROM students s
            LEFT JOIN point_entries p ON p.student_id = s.id
            GROUP BY s.id
            ORDER BY total_points DESC, s.full_name ASC
            """
        )
        rows = await cursor.fetchall()
        board = []
        for i, r in enumerate(rows):
            pts = int(r["total_points"])
            if i == 0:
                rank = 1
            elif pts == int(rows[i - 1]["total_points"]):
                rank = board[i - 1]["rank"]
            else:
                rank = i + 1
            entry = student_payload(row_to_dict(r))
            board.append(
                {
                    "rank": rank,
                    "id": entry["id"],
                    "full_name": entry["full_name"],
                    "nick_name": entry["nick_name"],
                    "age": entry["age"],
                    "subject": entry["subject"],
                    "has_photo": entry["has_photo"],
                    "total_points": pts,
                    "sessions_count": int(r["sessions_count"]),
                }
            )
        return jsonify({"leaderboard": board})
    finally:
        await db.close()


def _period_start(period: str):
    now = datetime.now(timezone.utc).date()
    if period == "weekly":
        start = now - timedelta(days=7)
    elif period == "monthly":
        start = now - timedelta(days=30)
    elif period == "yearly":
        start = now - timedelta(days=365)
    else:
        return None
    return start.isoformat()


async def _marks_report_rows(period: str):
    start = _period_start(period)
    db = await get_db()
    try:
        cursor = await db.execute(
            """
            SELECT s.id AS student_id, s.full_name, s.nick_name, s.age, s.subject,
                   p.entry_date, p.questions_count, p.points, p.note
            FROM point_entries p
            JOIN students s ON s.id = p.student_id
            WHERE date(p.entry_date) >= date(?)
            ORDER BY s.full_name, p.entry_date, p.id
            """,
            (start,),
        )
        rows = await cursor.fetchall()
        entries = []
        total_points = 0
        for r in rows:
            pts = int(r["points"])
            total_points += pts
            entries.append(
                {
                    "student_id": r["student_id"],
                    "full_name": r["full_name"],
                    "nick_name": r["nick_name"],
                    "age": r["age"],
                    "subject": r["subject"],
                    "entry_date": r["entry_date"],
                    "questions_count": int(r["questions_count"]),
                    "points": pts,
                    "note": r["note"] or "",
                }
            )
        return start, entries, total_points
    finally:
        await db.close()


@app.route("/api/reports/marks", methods=["GET"])
@require_admin
async def view_marks_report():
    period = (request.args.get("period") or "monthly").lower()
    if period not in ("weekly", "monthly", "yearly"):
        return jsonify({"error": "period must be weekly, monthly, or yearly"}), 400

    start, entries, total_points = await _marks_report_rows(period)
    return jsonify(
        {
            "period": period,
            "from_date": start,
            "to_date": datetime.now(timezone.utc).date().isoformat(),
            "entries": entries,
            "entry_count": len(entries),
            "total_points": total_points,
        }
    )


if __name__ == "__main__":
    asyncio.run(init_db())
    app.run(host="0.0.0.0", port=5000, debug=True)
