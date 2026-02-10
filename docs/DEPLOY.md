# Deploy Guide (Staging/Prod)

This project can be deployed with Docker Compose on a single server.

## 1. Prerequisites
- Linux server or VM
- Docker + Docker Compose plugin
- Open port `80` (HTTP)

## 2. Prepare environment
From repo root:

```bash
cp .env.example .env
```

Edit `.env` and set secure values:
- `JWT_SECRET_KEY`
- `ADMIN_BOOTSTRAP_SECRET`
- `POSTGRES_PASSWORD`

## 3. Build and start

```bash
docker compose up -d --build
```

Check status:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

After startup, app is available at:
- Frontend: `http://<SERVER_IP>/`
- API via frontend reverse proxy: `http://<SERVER_IP>/api/...`

## 4. Bootstrap first admin

Run once after first deploy:

```bash
curl -X POST "http://<SERVER_IP>/api/v1/admin/bootstrap" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "<ADMIN_BOOTSTRAP_SECRET>",
    "email": "admin@example.com",
    "password": "StrongPassword123!"
  }'
```

Then login in admin panel with this account.

## 5. Update release

```bash
git pull
docker compose up -d --build
```

## 6. Backup and restore (Postgres)

Database data is stored in Docker volume `pg_data`.

Simple SQL dump:

```bash
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup-$(date +%F).sql
```

## 7. Smoke checks after deploy
1. Open `/` and submit a test feedback.
2. Open `/dashboard/settings` and login.
3. Verify feedback appears in admin list.
4. Run backend tests in CI and optional local k6 smoke:
   `k6 run loadtests/k6_feedback_smoke.js`
