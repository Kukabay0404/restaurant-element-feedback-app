# Release Gate v0.1.0 (GO / NO-GO)

Release candidate:
- Version: `v0.1.0`
- Branch/commit:
- Date:
- Owner:

## 1. Required Inputs

| Input | Source | Required | Status | Notes |
|---|---|---|---|---|
| Backend automated tests | GitHub Actions (`.github/workflows/backend-tests.yml`) | Yes |  |  |
| Manual QA checklist run | `docs/MANUAL_QA_CHECKLIST_v0.1.md` | Yes |  |  |
| Performance smoke report | `docs/reports/k6_feedback_smoke_summary.json` | Yes |  |  |
| Open blocker defects | Issue tracker | Yes |  |  |

## 2. Exit Criteria Validation

| Criterion | Target | Current Evidence | Result |
|---|---|---|---|
| Critical API tests | 100% pass | Local pytest: `4 passed` | Provisionally PASS |
| Manual E2E | No blocker bugs | Local API-oriented run: `docs/reports/MANUAL_QA_RUN_2026-02-10.md` | PARTIAL (staging UI pending) |
| p95 latency (reads) | `<300ms` | See staging k6 run |  |
| p95 latency (writes) | `<500ms` | Local smoke pass: `p95=191.86ms` | Provisionally PASS |
| 5xx error rate | `<1%` | Local smoke: `0%` | Provisionally PASS |

## 3. Risk Review

| Risk | Owner | Mitigation | Status |
|---|---|---|---|
| Token expiry behavior in admin UI |  | Run manual UI scenario on staging |  |
| Concurrent moderation actions |  | Test simultaneous approve/delete |  |
| Threshold edge values (1/10) |  | Covered by API checks, verify UI path |  |
| SQLite lock contention |  | Monitor during staging load |  |

## 4. Go/No-Go Meeting Notes

Attendees:
- Product:
- Backend:
- Frontend:
- QA:

Decision:
- `GO` / `NO-GO`

Rationale:
- 

Follow-ups (if NO-GO):
1. 
2. 
3. 

Release window (if GO):
- Date/time:
- Rollback owner:
- Rollback steps reference:
