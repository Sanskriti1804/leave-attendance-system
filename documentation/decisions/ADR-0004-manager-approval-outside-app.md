# ADR-0004: Manager approval is outside the application

## Status

Confirmed (LV-WF-01, BR-15, BR-16, LV-WF-09, LV-WF-13).

## Context

Leave still needs a reporting-manager step when a manager exists, but it is not an in-app inbox. A later pack sentence that says managers approve inside the app **contradicts** Confirmed IDs.

## Decision

Trust Confirmed BRD: manager approval happens outside the app. Employee submits with proof/attestation when a manager exists. No manager → HR-direct, no manager proof. **No manager-approve API.**

## Alternatives Considered

- In-app manager queue (contradicts Confirmed BR-15).

## Security Impact

Proof documents must be authorized like other uploads. Do not treat client `manager_approval_attested` as sufficient without server rules (attestation field is Proposed).

## Performance Impact

None.

## Operational Impact

HR still performs the in-app decision (approve/reject/clarify).

## Consequences

Do not build manager dashboards for leave approval.

## Rollback / Migration Path

Moving approval in-app would be an authorization/workflow change requiring approval.

## Date

2026-08-27

## Approved By

BRD Confirmed IDs; no additional sign-off recorded.
