# Clinical TaskFlow — Frontend

Kanban task board and clinical image review UI built with Next.js 16, React 19, TypeScript, Tailwind CSS.

## Environment versions

- Node.js `20.18.0` (recommended; see `.node-version`)
- npm `10+`
- Tested with Next.js `16.2.10`, React `19.2.4`, TypeScript `5.x`

## Detailed local run steps

```bash
cd taskflow-frontend
npm install
cp .env.local.example .env.local
npm run dev
```

App: `http://localhost:3000`  
Backend API (default): `http://127.0.0.1:8000/api`

If backend is not running yet:

```bash
cd ../taskflow-backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_demo_user
python manage.py runserver
```

## Demo credentials

| Field | Value |
|---|---|
| Email | `demo.doctor@taskflow.local` |
| Password | `DoctorDemo123!` |

Seed backend first: `python manage.py seed_demo_user`

## Features

| Route | Description |
|---|---|
| `/login` | JWT email/password sign-in |
| `/tasks` | Date-scoped Kanban — CRUD, drag/drop, priority & tag chips |
| `/annotate` | Square canvas image review with cursor/annotate/pan tools |

### Annotation tools

1. **Select (default)** — click polygon on canvas or list, then delete
2. **Annotate** — draw polygon; autosaves on close (double-click or click first point)
3. **Pan** — drag when zoomed in

## QA checklist

See [`./QA_CHECKLIST.md`](./QA_CHECKLIST.md) for the full acceptance checklist and 2-minute demo video script.

## Villains faced (and how we won)

The biggest frontend villain was **polygon interaction complexity**: zoom/pan math, image letterboxing, and vertex placement needed to agree perfectly, otherwise saved shapes drifted. We defeated this with normalized coordinates, shared canvas layout utilities, and tight validation between frontend and backend.

Another villain was **UI interaction conflict** (dragging cards when trying to click actions, accidental annotation actions, and delayed note loading). We overcame it by adding dedicated drag handles, clear tool-mode boundaries, debounce-based autosave, and series-scoped data fetching/state keys.

## Build

```bash
npm run build
npm run lint
```

## Deployment on Render

This project is configured for [Render](https://render.com) as a Node web service per:
[Deploy a Next.js App on Render](https://render.com/docs/deploy-nextjs-app).

### Blueprint (recommended)

1. Push this repo to GitHub.
2. In Render Dashboard → **Blueprints** → **New Blueprint Instance**.
3. Connect the repository and apply `render.yaml`.
4. Set environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://<your-backend>.onrender.com/api`

Rebuild after changing `NEXT_PUBLIC_API_URL` (it is embedded at build time).

### Manual web service

| Setting | Value |
|---|---|
| Runtime | Node 20 |
| Build Command | `npm install && chmod +x ./build.sh && ./build.sh` |
| Start Command | `npm start` |

Required env var: `NEXT_PUBLIC_API_URL=https://<your-backend>.onrender.com/api`

`build.sh` reuses `.next/cache` on Render between builds when available.
