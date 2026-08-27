# Proposed schema

Columns below are from the engineering pack only. Do not add fields in code that are not listed here unless an ADR updates this file.

## org_settings (single row)

`id`, `timezone` default `'America/New_York'`, `work_start`, `work_end` (may be before start for overnight), `grace_minutes` ≥ 0, `weekly_off_dow` int[] ISO 1–7, `leave_count_excludes_weekends`, `leave_count_excludes_holidays`, `medical_doc_optional_1_to_2_days` default true, `medical_doc_exceeds_days` default 2, `max_advance_days` default **4 (TD for ½ week)**, `updated_at`, `row_version`.

## users

1:1 with `auth.users`. `id` = Auth UUID, `email` citext UNIQUE, `role` CHECK `employee|admin|guest_admin`, `is_active` default true, timestamps. Soft-deactivate; do not delete Auth user in v1 (TD).

## employees

`id`, `user_id` UNIQUE FK users RESTRICT, `full_name`, `department` text **nullable**, `sex` CHECK `male|female|unspecified` nullable, `reporting_manager_employee_id` FK employees SET NULL nullable, `deactivated_at`, timestamps, `row_version`.

## leave_types

`id`, `code` UNIQUE, `name`, `is_active`, `is_paid` default true, `is_medical` default false (Sick seeded true **TD**), `allowed_sex` NULL=all / `'female'`, `requires_prior_notice`, `max_advance_days` nullable, timestamps.

Seed: **CASUAL, SICK, EMERGENCY, PLANNED**. DELETE only if unused.

## public_holidays

`id`, `holiday_date` UNIQUE, `name`.

## leave_applications

`id`, `employee_id`, `leave_type_id`, `start_date`, `end_date`, `duration_mode` HALF_DAY|FULL_DAY|MULTIPLE_DAYS, `half_session` FIRST|SECOND nullable, `calculated_days` > 0, `is_paid` snapshot, `reason`, `status` DRAFT|SUBMITTED|PENDING_HR_REVIEW|APPROVED|REJECTED|CANCELLED|WITHDRAWN, `reporting_manager_employee_id` snapshot nullable, `manager_approval_attested` default false, `clarification_comment`, `hr_comments`, `submitted_at`, `reviewed_at`, `reviewed_by_user_id`, `cancelled_or_withdrawn_at`, `row_version`, timestamps.

CHECKs: start≤end; half-day needs session and start=end; full-day start=end.

## leave_status_history (append-only)

`id`, `leave_application_id`, `from_status`, `to_status`, `actor_user_id`, `comment`, `occurred_at`.

## documents

Metadata; bytes in Storage. `id`, `leave_application_id` nullable, `correction_id` nullable, `kind` MEDICAL|MANAGER_PROOF|CORRECTION|SUPPORTING, `storage_bucket`, `storage_key` UNIQUE, `original_filename`, `content_type`, `byte_size` > 0, `uploaded_by_user_id`, `created_at`.

## attendance_days

One row per employee per `work_date`. `id`, `employee_id`, `work_date`, UNIQUE(employee_id, work_date), `check_in_at`, `check_out_at`, `leave_application_id` nullable SET NULL, `derived_status` (eight BRD labels), `is_late`, `admin_modified` default false, `row_version`, timestamps.

## attendance_corrections

`id`, `employee_id`, `attendance_day_id` nullable, `work_date`, `correction_type` **enum OPEN**, `proposed_check_in_at`/`out`, `reason`, `status` SUBMITTED|APPROVED|REJECTED **TD**, `source` EMPLOYEE|SYSTEM_INT03|SYSTEM_STS10, `hr_comments`, `reviewed_by_user_id`, `reviewed_at`, `row_version`, timestamps. Partial unique one SUBMITTED per (employee, date) **TD**.

## correction_status_history

Same pattern as leave history; FK `correction_id`.

## notifications

`id`, `recipient_user_id`, `event_type`, `channel` IN_APP|EMAIL, `payload` jsonb, `read_at`, `sent_at`, `created_at`.

## audit_events (append-only, no UPDATE/DELETE)

`id`, `occurred_at`, `actor_user_id` nullable (jobs), `action`, `entity_type`, `entity_id`, `before_json`, `after_json`, `request_id`, `ip`.

## idempotency_keys

PK `(user_id, key)`: `request_hash`, `response_status`, `response_body`, `created_at`, `expires_at`.

## Also

`auth.users` (Supabase). `org_settings` and `public_holidays` have no FK to employees.
