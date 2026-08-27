# ERD (Proposed)

Cardinalities from the engineering pack. Not implemented.

```mermaid
erDiagram
  auth_users ||--|| users : "id"
  users ||--o| employees : "user_id"
  employees ||--o{ employees : "reporting_manager"
  employees ||--o{ leave_applications : "employee_id"
  leave_types ||--o{ leave_applications : "leave_type_id"
  leave_applications ||--o{ leave_status_history : "history"
  leave_applications ||--o{ documents : "docs"
  leave_applications ||--o{ attendance_days : "on_leave"
  employees ||--o{ attendance_days : "days"
  employees ||--o{ attendance_corrections : "corrections"
  attendance_days ||--o{ attendance_corrections : "optional_day"
  attendance_corrections ||--o{ correction_status_history : "history"
  attendance_corrections ||--o{ documents : "correction_docs"
  users ||--o{ notifications : "recipient"
  users ||--o{ audit_events : "actor"
  users ||--o{ idempotency_keys : "keys"
  org_settings ||--|| org_settings : "singleton"
  public_holidays ||--o{ public_holidays : "dates"
```

`org_settings` and `public_holidays` have no FK to employees.

## FK on delete (Proposed)

- `employees.user_id` RESTRICT
- manager SET NULL
- leave employee/type RESTRICT
- `attendance_days.leave_application_id` SET NULL
- documents SET NULL or RESTRICT if attached
