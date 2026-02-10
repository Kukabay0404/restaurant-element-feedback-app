# Manual QA Checklist v0.1 (MVP)

Environment:
- Base URL frontend:
- Base URL backend:
- Build/commit:
- Tester:
- Date:

Status values:
- `PASS`
- `FAIL`
- `BLOCKED`
- `N/A`

## A. Public Feedback Flow

| ID | Scenario | Steps | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| A-01 | Open public form | Open `/` | Feedback page renders with form fields and submit button |  |  |
| A-02 | Submit valid review | Fill valid payload (`type=review`, rating 1..10, text/name/contact) and submit | Success response, no frontend crash, new record appears in admin list |  |  |
| A-03 | Submit valid suggestion | Fill valid payload (`type=suggestion`) and submit | Success response, item created correctly |  |  |
| A-04 | Validation: empty required fields | Submit with one required field empty | Validation blocks submission or backend returns validation error |  |  |
| A-05 | Validation: rating boundaries | Submit with rating `<1` and `>10` | Request rejected by validation (frontend/backend) |  |  |

## B. Admin Authentication

| ID | Scenario | Steps | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| B-01 | Admin login success | Open `/dashboard`, login with valid admin credentials | Auth success, dashboard content visible |  |  |
| B-02 | Admin login failure | Login with invalid credentials | Error shown, no auth granted |  |  |
| B-03 | Protected endpoints without token | Call admin endpoint without auth (or open page after logout) | `401 Unauthorized` and/or redirect to login |  |  |
| B-04 | Logout | Click logout in admin panel | Token removed, user returned to login state |  |  |

## C. Moderation Actions

| ID | Scenario | Steps | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| C-01 | Approve pending feedback | In admin list, approve a pending item | Item status changes to approved |  |  |
| C-02 | Delete feedback | Delete an item via UI | Item removed from list, no UI inconsistency |  |  |
| C-03 | Pending/approved buckets | Compare counts visually after actions | Items appear in correct bucket according to `is_approved` |  |  |

## D. Moderation Settings

| ID | Scenario | Steps | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| D-01 | Open settings page | Open `/dashboard/settings` after login | Settings page loads and current values are shown |  |  |
| D-02 | Save settings | Toggle `auto_approve_enabled`, change threshold, click save | Save success message, values persist after refresh |  |  |
| D-03 | Threshold boundary: 1 | Set threshold to `1`, save, submit rating `1` and `2` | `1` -> pending, `2` -> auto-approved (if auto-approve enabled) |  |  |
| D-04 | Threshold boundary: 10 | Set threshold to `10`, save, submit rating `10` | Rating `10` stays pending (since rule is `rating > threshold`) |  |  |
| D-05 | Auto-approve disabled | Disable auto-approve and submit high rating | New item is pending |  |  |

## E. Navigation and UI Smoke

| ID | Scenario | Steps | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| E-01 | Sidebar navigation | Navigate Panel -> Reviews -> Analytics -> Settings | Pages open correctly, active nav item highlighted |  |  |
| E-02 | Dashboard data load | Open each admin tab | Data loads without blocking errors |  |  |
| E-03 | Mobile/adaptive smoke | Open app in narrow viewport | Layout remains usable, no overlap/blocking controls |  |  |

## F. Regression Smoke

| ID | Scenario | Steps | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| F-01 | Public approved list | Call/open approved feedback list | Only approved items are returned in public list |  |  |
| F-02 | Reviews analytics view | Open analytics tab after new submissions | Charts and counts update without runtime errors |  |  |
| F-03 | Session refresh behavior | Keep admin page open, switch tab, return | Data refresh continues to work, no forced logout unless token invalid |  |  |

## Summary

- Total cases:
- PASS:
- FAIL:
- BLOCKED:
- Recommendation (`GO` / `NO-GO`):
- Final notes:
