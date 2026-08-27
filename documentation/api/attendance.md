# Attendance API (Proposed)

Not implemented. Punch uniqueness and HR PATCH are not fully signed. See ADR-0007 and attendance features.

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/attendance/check-in` | Punch in; Idempotency-Key | E |
| POST | `/attendance/check-out` | Punch out | E |
| GET | `/attendance/me` | History + month summary | E |
| GET | `/attendance/me/dashboard` | Today + late/missing EST | E |
| GET | `/attendance` | Org attendance | A G |
| PATCH | `/attendance/{id}` | Admin direct edit (AT-COR-11) | A — **Conflict** |
| GET | `/hr/dashboard` | HR-DASH-01–08 | A G |
| POST | `/attendance/corrections` | Employee correction | E |
| GET | `/attendance/corrections` | List | E own; A G all |
| GET | `/attendance/corrections/{id}` | Detail | owner A G |
| POST | `/attendance/corrections/{id}/approve` | Apply times | A |
| POST | `/attendance/corrections/{id}/reject` | `{comment}` | A |

Proposed errors: `ALREADY_CHECKED_IN`, `NO_CHECK_IN`, `VERSION_CONFLICT`.

Server clock for punch timestamps is Proposed (TZ-01). Employees must not PATCH attendance days.
