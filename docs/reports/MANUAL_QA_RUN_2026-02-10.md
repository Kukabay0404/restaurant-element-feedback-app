# Manual QA Run (2026-02-10)

Scope executed: API-verifiable cases from `docs/MANUAL_QA_CHECKLIST_v0.1.md`  
Environment: local (`http://127.0.0.1:8000`)

## Result summary
- Total executed: `15`
- PASS: `15`
- FAIL: `0`
- BLOCKED (not executed in this run): UI-only cases

## Executed cases
- `A-02` PASS (`201`)
- `A-03` PASS (`201`)
- `A-05` PASS (`422`)
- `B-03` PASS (`401`)
- `B-01` PASS (login ok)
- `B-02` PASS (`401`)
- `D-01` PASS (`200`)
- `D-02` PASS (`200`)
- `D-03` PASS (threshold=1 behavior confirmed)
- `D-04` PASS (threshold=10 behavior confirmed)
- `D-05` PASS (auto-approve off behavior confirmed)
- `C-01` PASS (`200`)
- `C-02` PASS (`204`)
- `C-03` PASS (status field consistency)
- `F-01` PASS (public endpoint returns approved only)

## Not executed in this run
The following checklist areas are UI/manual and require browser-based staging pass:
- `A-01`, `A-04`
- `B-04`
- `E-01`, `E-02`, `E-03`
- `F-02`, `F-03`

## Notes
- Test data (`qa-*`) and temporary admin user were created and removed during the run.
- Moderation settings were restored to default:
  - `auto_approve_enabled=false`
  - `manual_review_rating_threshold=6`
