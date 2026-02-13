# Restaurant Element Feedback App

[![Backend Tests](https://github.com/Kukabay0404/restaurant-element-feedback-app/actions/workflows/backend-tests.yml/badge.svg)](https://github.com/Kukabay0404/restaurant-element-feedback-app/actions/workflows/backend-tests.yml)
[![Deploy: Render](https://img.shields.io/badge/deploy-render-46E3B7)](https://render.com/)
[![Stack: FastAPI + React](https://img.shields.io/badge/stack-FastAPI%20%7C%20React-222)](#tech-stack)

A web app for restaurant feedback collection with an admin moderation panel.

## Features
- Public form for reviews and suggestions.
- Admin panel for review, approval, deletion, and analytics.
- Moderation settings:
  - `auto_approve_enabled`
  - `manual_review_rating_threshold`
- Backend CI tests with GitHub Actions.
- Load smoke testing with `k6`.

## Tech Stack
- Backend: `FastAPI`, `SQLAlchemy`, `Alembic`, `PostgreSQL`
- Frontend: `React`, `TypeScript`, `Vite`
- Infra: `Docker`, `docker-compose`, `Render Blueprint`
- QA: `pytest`, `Playwright`, `k6`

## Repository Structure
```text
backend/      FastAPI API, migrations, tests
frontend/     React app (public page + admin UI)
docs/         Deployment and QA docs
loadtests/    k6 scenarios
render.yaml   Render Blueprint config
```

## Quick Start (Local)
### 1) Backend
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/Mac
# source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2) Frontend
```bash
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

App URLs:
- Public: `http://127.0.0.1:5173/`
- Admin: `http://127.0.0.1:5173/dashboard`

## Deploy
- Render: `docs/DEPLOY_RENDER.md`
- Docker Compose: `docs/DEPLOY.md`

## QA and Release
- Test plan: `docs/TEST_PLAN_v0.1.md`
- Manual checklist: `docs/MANUAL_QA_CHECKLIST_v0.1.md`
- Release gate: `docs/RELEASE_GATE_v0.1.md`
- Load testing: `docs/LOAD_TESTING.md`

## API Notes
- Public endpoints:
  - `GET /api/v1/feedback/`
  - `POST /api/v1/feedback/create`
- Admin endpoints:
  - `POST /api/v1/admin/login`
  - `GET /api/v1/feedback/admin`
  - `PATCH /api/v1/feedback/admin/{id}/approve`
  - `DELETE /api/v1/feedback/delete/{id}`
  - `GET/PATCH /api/v1/feedback/admin/settings/moderation`

## CI
Workflow: `.github/workflows/backend-tests.yml`

## Contributing
Before opening a PR:
1. Run backend tests: `pytest -q`
2. Run frontend build: `npm run build`
3. Update docs if behavior/API/deploy changed.

Details: `CONTRIBUTING.md`.
