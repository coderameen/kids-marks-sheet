# Deploy on Vercel only (free)

Everything runs in **one Vercel project**: Next.js UI + `/api` routes + database.

No Render. The browser only talks to **`https://olympiad-exams.vercel.app`** — no localhost, no “access other apps” prompts.

## 1. Database (Turso — free, required for live data)

Vercel serverless cannot keep a writable SQLite file. Use **Turso** (free SQLite cloud):

1. Sign up at [turso.tech](https://turso.tech) (free tier).
2. Install CLI: `curl -sSfL https://get.tur.so/install.sh | bash` (or see Turso docs on Windows).
3. Create DB and import your data:
   ```bash
   turso db create olympiad-exams
   turso db import olympiad-exams --from-file "frontend/data/marks.db"
   turso db tokens create olympiad-exams
   ```
4. Copy **Database URL** and **token**.

## 2. Vercel project

1. [Vercel team](https://vercel.com/syeda-sumera-amreen-s-projects) → **Add New** → **Project** → GitHub **kids-marks-sheet**.
2. **Root Directory:** `frontend`
3. **Project Name:** `olympiad-exams`
4. **Environment variables** (Production + Preview):

   | Name | Value |
   |------|--------|
   | `TURSO_DATABASE_URL` | `libsql://...` from Turso |
   | `TURSO_AUTH_TOKEN` | token from Turso |
   | `JWT_SECRET` | any long random string |
   | `ADMIN_USERNAME` | `admin` (optional) |
   | `ADMIN_PASSWORD` | your admin password (optional) |

5. **Remove** old `API_URL` / Render URLs if you added them before.
6. **Deploy**.

Site: **https://olympiad-exams.vercel.app**

## 3. Test

- https://olympiad-exams.vercel.app/api/health → `{"status":"ok"}`
- https://olympiad-exams.vercel.app/student
- https://olympiad-exams.vercel.app/admin/login → `admin` / `Ameen@0805`

All phones and laptops use the **same Turso database**.

## Local development

```powershell
cd frontend
npm install
npm run dev
```

Uses `frontend/data/marks.db` automatically (no Turso needed on your PC).

Optional: double-click `frontend\RUN-DEV.cmd`.

Backend Flask folder is **legacy/local only**; production uses Next.js `/api` only.
