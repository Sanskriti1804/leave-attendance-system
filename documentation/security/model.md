# Security model

Separate **Confirmed** requirements from **Proposed** engineering controls.

## Confirmed

| Control | IDs |
| --- | --- |
| Email/password auth (details TBD) | AUTH-10 |
| Employee vs HR/Admin capabilities; three roles | AUTH-01, AUTH-09 |
| Own-data only for employees | AUTH-02, AUTH-03, BR-13 |
| Org-wide HR/Admin access | AUTH-04, BR-14 |
| HR/Admin manage employees | AUTH-05 |
| Medical documents: HR/Admin access; employees must not view/download | AUTH-06, MED-09 |
| Upload types PDF, JPG, JPEG, PNG | BR-06, MED-05 |
| Audit every change | BR-12, AUD-01 |
| Employees cannot directly edit attendance | BR-10 |

## Proposed (not signed)

- HTTPS; Bearer JWT; server checks `exp`.
- Express authorization plus Postgres RLS. Do not rely on RLS alone if using the service role.
- Private Storage bucket; upload via Express service role; signed download after authz.
- Magic-byte + allowlist on uploads; technical cap **10 MiB until MED-06** (TD-17).
- Rate limit login and check-in (429).
- Separate Supabase projects per environment; never share service-role keys.
- Employee foreign-resource: 404 not 403 (TD, needs confirmation).
- Password hashes only in Supabase Auth; never in API DTOs.
- `DOCUMENT_DOWNLOAD` audit for medical GET (TD).
- Notification payloads must not include medical bytes.

## Sensitive data

Leave reasons, medical files, attendance times, email. Do not log secrets or medical content.

## Open

- MED-06 file size, MED-10 retention
- AUTH-10 session TTL and provisioning
- AUD-08 who can view audit
- Self-approval of own leave by admin

## Security testing (recommendation, not a BRD section)

When a test stack exists: guest_admin write 403; employee medical GET 403; employee cannot read others’ records; authn failures do not leak existence beyond the signed 404/403 policy.
