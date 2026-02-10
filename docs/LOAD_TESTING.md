# Load Testing (k6)

## Smoke Scenario
File: `loadtests/k6_feedback_smoke.js`

What it does:
- sends feedback via `POST /api/v1/feedback/create`
- reads public list via `GET /api/v1/feedback/`
- validates response codes and latency/error thresholds

## Prerequisites
1. Run backend API locally on `http://127.0.0.1:8000` (or set custom `BASE_URL`).
2. Install k6.

## Run
```bash
k6 run loadtests/k6_feedback_smoke.js
```

Custom API URL:
```bash
k6 run -e BASE_URL=http://localhost:8000 loadtests/k6_feedback_smoke.js
```

## Current thresholds
- `http_req_failed < 1%`
- `http_req_duration p95 < 500ms`
