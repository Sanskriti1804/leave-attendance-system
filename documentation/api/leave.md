# Leave API (Proposed)

Not implemented. Related Confirmed rules: leave application and workflow features.

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/leaves` | Submit | E |
| POST | `/leaves/drafts` | Save draft | E |
| GET | `/leaves` | List | E own; A G all |
| GET | `/leaves/{id}` | Detail | owner A G |
| PATCH | `/leaves/{id}` | Edit draft or after clarify | E owner |
| POST | `/leaves/{id}/submit` | Draft → pending | E owner |
| POST | `/leaves/{id}/approve` | Approve | A |
| POST | `/leaves/{id}/reject` | `{comment, rowVersion}` | A |
| POST | `/leaves/{id}/clarification` | `{comment}` | A |
| POST | `/leaves/{id}/withdraw` | Withdraw | E owner |
| POST | `/leaves/{id}/cancel` | Cancel | E A; **who-after-approve Open** |

Idempotency-Key on create/submit is Proposed.

Validation (Confirmed product, Proposed enforcement): dates, reason, overlap, medical, manager proof when manager exists, type eligibility, max advance.

Related entities: `leave_applications`, `leave_status_history`, `documents`, `attendance_days` on approve.

No manager-approve endpoint. No HR-absence endpoint.
