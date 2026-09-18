# kids-marks-sheet (Asra Sara Star Points)

Marks tracking system for preschool kids — admin and student dashboards for learning points, leaderboards, and in-app marks reports.

## Stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS
- **Backend:** Flask 3 async API, SQLite (persistent file)
- **Auth:** Admin JWT login (`admin` / `Ameen@0805` by default, override via env)

## Local development

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

API: `http://localhost:5000` — database file: `backend/data/marks.db`

### Frontend

From the **project root** (recommended):

```powershell
cd frontend
copy .env.local.example .env.local
npm run dev
```

Or from the repo root after `npm install` in `frontend` once:

```powershell
npm run dev
```

App: `http://localhost:3000`

**PowerShell tip:** Run `npm run dev` exactly — do **not** add a trailing `\` (that makes npm look for a script named `dev\` and fail).

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing |
| `/admin/login` | Admin sign-in |
| `/admin/dashboard` | Students list, add student, view marks reports |
| `/admin/dashboard/leaderboard` | Leaderboard |
| `/admin/dashboard/students/[id]` | Add points with date |
| `/student` | Student leaderboard |
| `/student/[id]` | Student profile & points by date |

## Docker

```bash
copy backend\.env.example .env
docker compose up --build
```

SQLite is stored in the `marks_data` Docker volume.

## Production notes

- Set `JWT_SECRET`, `ADMIN_PASSWORD`, and `CORS_ORIGINS` to your frontend URL.
- Set `NEXT_PUBLIC_API_URL` to your public API URL when building the frontend.
