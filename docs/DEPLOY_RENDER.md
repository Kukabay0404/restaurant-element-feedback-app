# Deploy on Render (Free Tier)

This setup deploys:
- `element-feedback-api` (backend, Docker web service)
- `element-feedback-frontend` (frontend, static web service)
- `element-feedback-db` (managed Postgres, free plan)

Config file:
- `render.yaml`

## 1. Data layer
This setup uses managed Render Postgres from `render.yaml`.
No SQLite persistence issues on web-service restarts.

## 2. Create services from Blueprint
1. Push repo to GitHub.
2. In Render dashboard: **New +** -> **Blueprint**.
3. Select this repository.
4. Render reads `render.yaml` and creates database + two services.

## 3. Fix frontend/backend URLs after first deploy
Render service names may differ if name is occupied.

After deploy:
1. Copy actual backend URL (example: `https://element-feedback-api.onrender.com`).
2. In frontend service env var `VITE_API_BASE_URL`, set this exact backend URL.
3. Copy actual frontend URL (example: `https://element-feedback-frontend.onrender.com`).
4. In backend service env var `CORS_ORIGINS`, set:
   - frontend URL
   - local dev URLs if needed
   Example:
   `https://your-frontend.onrender.com,http://127.0.0.1:5173,http://localhost:5173`
5. Redeploy both services.

## 4. Bootstrap admin (run once)
Use backend URL and `ADMIN_BOOTSTRAP_SECRET` from backend env vars:

```bash
curl -X POST "https://<BACKEND_URL>/api/v1/admin/bootstrap" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "<ADMIN_BOOTSTRAP_SECRET>",
    "email": "admin@example.com",
    "password": "StrongPassword123!"
  }'
```

## 5. Post-deploy checks
1. Open frontend URL.
2. Submit one feedback.
3. Open `/dashboard/settings`, login with admin.
4. Verify feedback appears in admin list.
5. Run smoke checks:
   - UI: `node frontend/scripts/ui_qa_check.mjs` with `BASE_URL`
   - Load: `k6 run -e BASE_URL=https://<BACKEND_URL> loadtests/k6_feedback_smoke.js`
