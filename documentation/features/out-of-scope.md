# Out of scope

Do not implement these as if they were MVP requirements.

| Item | Why |
| --- | --- |
| Leave balances / accruals / entitlements | BRD mentions policies but **does not define a balance system**. LV-BAL-08/09 probation/notice only if balances are added later. |
| Overtime | Explicitly out of scope in the pack. |
| Payroll | Not in requirements. |
| SSO / external IdP | Not in requirements. |
| Microsoft Teams / Slack | NOTIF-10 Future. |
| Sandwich-fill weekends/holidays as leave | CAL-07 Confirmed **no**. |
| Multi-company / `org_id` multi-tenant | Not in v1. |
| Per-employee timezone | Not in v1. |
| Multiple punch events per work date | Schema: one row per employee per date. |
| Manager leave approval inside the app | BR-15 / LV-WF-01 Confirmed outside. |
| Stored status “Unauthorized Absence” | Do not invent. |
| Biometric / third-party HRIS | Not mentioned. |

Web vs mobile: the **engineering pack** called mobile out of scope; this **repository** already has an Expo app. Keep Expo (ADR-0005). That is a platform conflict, not permission to build a second frontend.
