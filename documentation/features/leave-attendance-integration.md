# Leave–attendance integration

## Status

Confirmed INT-01, INT-03. **Not implemented.**

## Purpose

Keep leave decisions and daily attendance consistent.

## Business Rules

| ID | Rule | Status |
| --- | --- | --- |
| INT-01 / BR-09 | Approved leave automatically **On Leave** in attendance | Confirmed |
| INT-03 | If leave is approved after punches already exist → **correction request**; do not silently overwrite | Confirmed |
| LV-STS-10 | Cancel/withdraw approved leave → correction request | Confirmed |

## Database Impact

Proposed `attendance_days.leave_application_id`; system-sourced corrections `SYSTEM_INT03` / `SYSTEM_STS10`.

## Transactions

Leave status change, attendance derivation, correction insert, audit, and notification persist should be one transaction (Proposed). Email send after commit.

## Testing Requirements

Approve with no punches → On Leave. Approve with existing punches → correction, punches unchanged. Withdraw approved → correction.

## Change History

2026-08-27 — Extracted from source documentation.
