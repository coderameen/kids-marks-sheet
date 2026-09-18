# Deploy on Vercel only (free)

One project: **Next.js** + **`/api`** on Vercel. No Render. No Turso. No third-party database sites.

## 1. Create Postgres in Vercel (free storage)

1. Open your project on [Vercel](https://vercel.com/syeda-sumera-amreen-s-projects).
2. Go to **Storage** tab → **Create Database** → **Postgres** (Neon, included with Vercel).
3. Connect it to project **`olympiad-exams`**.  
   Vercel adds **`POSTGRES_URL`** automatically — you do not copy URLs from other websites.

## 2. Project settings

- **Root Directory:** `frontend`
- **Project Name:** `olympiad-exams`
- **Remove** old variables: `API_URL`, `TURSO_*`, Render URLs.

Optional env vars:

| Name | Purpose |
|------|---------|
| `JWT_SECRET` | Long random string (recommended) |
| `ADMIN_PASSWORD` | Change admin password (optional) |

## 3. Deploy

Push to GitHub or click **Redeploy**. On first API call, tables and seed data are created (Saruu ❤️, Asruu ❤️, 3 points each, admin login).

## 4. Test

- https://olympiad-exams.vercel.app/api/health
- https://olympiad-exams.vercel.app/student
- https://olympiad-exams.vercel.app/admin/login → `admin` / `Ameen@0805`

All devices share the **same Vercel Postgres** database.

## Local development (your PC)

```powershell
cd frontend
npm install
npm run dev
```

Uses `frontend/data/marks.db` on your computer — no Postgres needed locally.  
Or double-click **`frontend\RUN-DEV.cmd`**.
