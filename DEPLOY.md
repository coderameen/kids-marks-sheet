# Free deployment (Vercel + Render)

The **Next.js** app runs on [Vercel](https://vercel.com) (free). The **Flask API + SQLite** runs on [Render](https://render.com) (free). Everyone uses the **same** `marks.db` and photos from the repo.

## 1. API on Render (free)

1. Open [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
2. Connect GitHub repo [kids-marks-sheet](https://github.com/coderameen/kids-marks-sheet).
3. Apply `render.yaml` → service name **`olympiad-exams-api`**.
4. After deploy, copy the URL (e.g. `https://olympiad-exams-api.onrender.com`).

First request after idle may take ~30s (free tier cold start).

## 2. Frontend on Vercel (free)

1. [Vercel Dashboard](https://vercel.com/syeda-sumera-amreen-s-projects) → **Add New** → **Project**.
2. Import **kids-marks-sheet** from GitHub.
3. **Root Directory:** `frontend`
4. **Project Name:** `olympiad-exams`
5. **Environment variable:**
   - `NEXT_PUBLIC_API_URL` = your Render URL (no trailing slash), e.g. `https://olympiad-exams-api.onrender.com`
6. Deploy.

Your site will be like **`https://olympiad-exams.vercel.app`** (free subdomain).

## 3. Mobile & laptop

Layout is responsive. Open the Vercel URL on phone or desktop; no app store needed.

## Local vs production

| | Local | Production |
|---|--------|------------|
| Web | http://localhost:3000 | https://olympiad-exams.vercel.app |
| API | http://127.0.0.1:5000 | https://olympiad-exams-api.onrender.com |
| Admin | admin / Ameen@0805 | same (from committed DB) |
