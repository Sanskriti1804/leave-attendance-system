# Testing strategy

## Facts

The concatenated source listed Testing in the pipeline but **did not contain a testing specification**. Mobile has no test runner in `package.json`.

Backend HTTP coverage lives in `backend/test-all-apis.ts` (`npm test` / `npm run test:apis`). Postman v2.1 JSON: `backend/postman/` (also `documentation/testing/postman/`). See [backend-api.md](backend-api.md).

Test framework choice is a **Pending Decision**. Do not treat Jest, Detox, or Playwright as requirements.

## Required reporting (process)

For every completed coding task, report tests executed, passed, failed, skipped, and remaining risks. If tests cannot be run, explain why.

## Recommendations (not requirements)

When a runner is chosen:

- API: guest_admin mutations 403; employee isolation; medical GET; overlap; punch rules **as signed**; INT-01 / INT-03; leave status transitions.
- Do not assert a stored “Unauthorized Absence” status.
- Mobile: login validation, punch button disabled states, navigation guards once session exists.
- Security: secrets absent from logs; no medical bytes in notification payloads.

Regression coverage should be added when those behaviors exist. Concurrency/idempotency tests are relevant if `Idempotency-Key` is adopted (Proposed).
