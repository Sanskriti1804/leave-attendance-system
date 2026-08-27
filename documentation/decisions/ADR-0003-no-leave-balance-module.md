# ADR-0003: No leave-balance module

## Status

Accepted as product constraint (BRD gap). Confirmed that balances are **not defined**.

## Context

BRD mentions leave policies but does not specify entitlements, accruals, or remaining days. LV-BAL-08/09 (probation/notice) are Clarification Required only if balances are added later.

## Decision

Do not create `leave_balances`, balance APIs, or UI. Do not block leave submit on remaining days.

## Alternatives Considered

- Invent a balance table (rejected: would invent requirements).

## Security Impact

None.

## Performance Impact

None.

## Operational Impact

HR approval is authorization to take leave without a system-enforced quota (BR-23 is Proposed and only applies **if** the org later uses balances).

## Consequences

Reports must not show remaining balance. Paid/unpaid follows LV-TYPE-07 and type config, not a ledger.

## Rollback / Migration Path

Adding balances later is a new feature with its own ADR and schema.

## Date

2026-08-27

## Approved By

Not a signed “approval”; this records the BRD omission as a binding implementation constraint.
