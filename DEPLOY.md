# Free deployment (Vercel + Render)

The **Next.js** app runs on [Vercel](https://vercel.com) (free). The **Flask API + SQLite** runs on [Render](https://render.com) (free). Everyone uses the **same** `marks.db` and photos from the repo.

The browser only talks to **your Vercel domain** (`/api/...`). Vercel proxies to Render — no localhost, no “access other apps on this device” prompt.

## 1. API on Render (free)

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
2. Connect [kids-marks-sheet](https://github.com/coderameen/kids-marks-sheet).
3. Apply `render.yaml` → **`olympiad-exams-api`** → Deploy.
4. Copy the URL, e.g. `https://olympiad-exams-api.onrender.com` (wait until **Live**).

First request after idle may take ~30s (free tier cold start).

## 2. Frontend on Vercel (free)

1. [Vercel team](https://vercel.com/syeda-sumera-amreen-s-projects) → **Add New** → **Project** → import **kids-marks-sheet**.
2. **Root Directory:** `frontend`
3. **Project Name:** `olympiad-exams` (lowercase, no spaces)
4. **Environment variables** (Production + Preview):

   | Name | Value |
   |------|--------|
   | `API_URL` | `https://olympiad-exams-api.onrender.com` (your Render URL, no trailing slash) |

   Optional duplicate: `NEXT_PUBLIC_API_URL` same value (used at build for rewrites if `API_URL` missing).

5. **Redeploy** after saving env vars.

Site: **https://olympiad-exams.vercel.app**

## 3. Multiple devices

Admin and students can open the same Vercel URL on any phone, tablet, or laptop. All use one shared database on Render.

## 4. Troubleshooting “Load failed”

- Render service must be **Live**; open the Render URL `/api/health` — should show `{"status":"ok"}`.
- Vercel must have **`API_URL`** set, then **Redeploy**.
- Click **Block** on any old browser “access other apps” prompt — that was from the previous localhost bug (now fixed).

## Local development

```powershell
# Terminal 1 — backend
cd backend
.\.venv\Scripts\activate
python app.py

# Terminal 2 — frontend
cd frontend
npm run dev
```

Rewrites proxy `http://localhost:3000/api` → `http://127.0.0.1:5000/api`.
