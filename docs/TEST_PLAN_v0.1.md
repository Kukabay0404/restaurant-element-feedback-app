# Test Plan v0.1 (MVP)

## 1. Goal
Validate MVP stability before release: core user flows, moderation settings behavior, and basic performance under load.

## 2. Scope (In)
- Public feedback submission.
- Admin auth (login) and protected endpoints.
- Admin moderation actions (approve/delete).
- Moderation settings:
  - `auto_approve_enabled`
  - `manual_review_rating_threshold`
- Dashboard lists and analytics smoke checks.

## 3. Scope (Out for v0.1)
- Full security pentest.
- Multi-region/HA failover.
- Browser matrix beyond latest Chrome/Edge.

## 4. Test Levels
### 4.1 Automated API tests (backend)
- `GET /api/v1/feedback/admin/settings/moderation` auth and default values.
- `PATCH /api/v1/feedback/admin/settings/moderation` update and readback.
- Feedback auto-approval rule:
  - rating `<= threshold` -> pending
  - rating `> threshold` with auto-approve on -> approved

### 4.2 Manual E2E checks (frontend + backend)
- Submit feedback from public form.
- Login to admin dashboard.
- Verify pending/approved buckets.
- Change moderation settings and verify behavior on new feedback.
- Delete/approve feedback and verify UI refresh.

### 4.3 Performance smoke (k6/Locust)
- RPS scenario for `POST /api/v1/feedback/create`.
- Read scenario for `GET /api/v1/feedback` and `GET /api/v1/feedback/admin`.
- Mixed admin actions scenario (`approve`, `delete`, settings read/update).

## 5. Exit Criteria (Go/No-Go)
- All critical API tests pass.
- No blocker bugs in manual E2E checklist.
- p95 latency target:
  - reads: < 300 ms
  - writes: < 500 ms
- 5xx error rate < 1% during performance smoke.

## 6. Risks to Watch
- Token expiry handling in admin UI.
- Concurrent moderator actions on the same item.
- Edge values for threshold (1 and 10).
- SQLite lock contention under concurrent writes.

## 7. Immediate Next Actions
1. Enable and monitor backend CI workflow `.github/workflows/backend-tests.yml`.
2. Create manual QA checklist document with pass/fail columns.
3. Run `loadtests/k6_feedback_smoke.js` on staging and capture report.
4. Define release gate meeting with Go/No-Go decision.
