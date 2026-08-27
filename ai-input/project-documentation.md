```plaintext
BRD
 ↓
Requirements clarification
 ↓
Business rules
 ↓
Edge cases
 ↓
Architecture
 ↓
Database design
 ↓
API contract
 ↓
Project structure
 ↓
Implementation plan
 ↓
Backend
 ↓
Frontend
 ↓
Testing
 ↓
Security
 ↓
CI/CD
 ↓
Deployment
 ↓
Production review


```

FEATURES :

- button disable - for logging in and logging out - for preventing double check out and check in
- hr can only change attendance of an employee upon request

# Leave Application & Attendance Management System

## Functional Requirements & Business Rules — Requirements Refinement Draft

> **Document status:** Requirements are **not yet business-confirmed**.
> This document separates **Confirmed from BRD**, **Proposed**, and **Requires Clarification** items so assumptions are not accidentally treated as requirements.

### Requirement Status

|   |
| - |

Status
Meaning

|   |
| - |

**Confirmed**

|   |
| - |

Explicitly stated in the current BRD

|   |
| - |

**Proposed**

|   |
| - |

A useful refinement/interpretation identified during analysis; requires business confirmation

|   |
| - |

**Clarification Required**

|   |
| - |

BRD does not define the behavior sufficiently

|   |
| - |

**Future**

|   |
| - |

Potential functionality not confirmed for MVP

---

# 1. User Roles & Access

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

AUTH-01

|   |
| - |

The system shall provide separate capabilities for **Employee** and **HR/Admin** users.

|   |
| - |

**Confirmed**

|   |
| - |

AUTH-02

|   |
| - |

Employees shall be able to access their own leave and attendance information.

|   |
| - |

**Confirmed**

|   |
| - |

AUTH-03

|   |
| - |

Employees shall not be able to view other employees' leave or attendance records.

|   |
| - |

**Confirmed**

|   |
| - |

AUTH-04

|   |
| - |

HR/Admin shall have organization-wide access to employee leave and attendance information.

|   |
| - |

**Confirmed**

|   |
| - |

AUTH-05

|   |
| - |

HR/Admin shall be able to manage employees.

|   |
| - |

**Confirmed**

|   |
| - |

AUTH-06

|   |
| - |

HR/Admin shall be able to access medical documents submitted by employees.

|   |
| - |

**Confirmed**

|   |
| - |

AUTH-07

|   |
| - |

HR/Admin shall be able to generate organizational reports.

|   |
| - |

**Confirmed**

|   |
| - |

AUTH-08

|   |
| - |

The system shall distinguish between HR and Admin permissions (read - only permission) if they are separate roles.

|   |
| - |

**Confirmed**

|   |
| - |

AUTH-09

|   |
| - |

There will be 3 roles in the system - employee, admin and guest admin 

|   |
| - |

**Confirmed**

|   |
| - |

AUTH-10

|   |
| - |

Authentication method - Email and password,  session expiry, password management, and account provisioning shall be defined.

|   |
| - |

**Confirmed**

---

# 2. Employee Management

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

EMP-01

|   |
| - |

HR/Admin shall be able to manage employee records.

|   |
| - |

**Confirmed**

|   |
| - |

EMP-02

|   |
| - |

The leave application shall automatically display the employee's name.

|   |
| - |

**Confirmed**

|   |
| - |

EMP-03

|   |
| - |

The leave application shall automatically display the employee's department/team.

|   |
| - |

**Confirmed**

|   |
| - |

EMP-04

|   |
| - |

The leave application shall automatically display the employee's reporting manager.

|   |
| - |

**Confirmed**

|   |
| - |

EMP-06

|   |
| - |

An employees without a department or reporting manager.

|   |
| - |

**Confirmed**

---

# 3. Leave Types & Configuration

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

LV-TYPE-01

|   |
| - |

The system shall support configurable leave types.

|   |
| - |

**Confirmed**

|   |
| - |

LV-TYPE-02

|   |
| - |

The current BRD lists Casual Leave, Sick Leave, Emergency Leave, and Planned Leave.

|   |
| - |

**Confirmed**

|   |
| - |

LV-TYPE-03

|   |
| - |

HR/Admin shall be able to manage configured leave types.

|   |
| - |

**Confirmed**

|   |
| - |

LV-TYPE-04

|   |
| - |

Leave types can be created, edited, deactivated, or deleted by HR

|   |
| - |

**Confirmed**

|   |
| - |

LV-TYPE-05

|   |
| - |

The system shall define whether additional leave types such as Unpaid, Maternity, Paternity, or Compensatory Leave are required.

|   |
| - |

**Confirmed**

|   |
| - |

LV-TYPE-06

|   |
| - |

The system shall define whether different employees can have different leave types. males can’t apply for maternity leave 

|   |
| - |

**Confirmed**

|   |
| - |

LV-TYPE-07

|   |
| - |

Leaves are paid usually - a leave without any prior information is considered unpaid leave

|   |
| - |

**Confirmed**

---

# 4. Leave Entitlement & Balance

> The current BRD mentions leave policies but **does not define an actual leave-balance system**. These requirements therefore require confirmation before implementation.

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

LV-BAL-08

|   |
| - |

The system shall define leave eligibility during probation.

|   |
| - |

**Clarification Required**

|   |
| - |

LV-BAL-09

|   |
| - |

The system shall define leave eligibility during an employee's notice period.

|   |
| - |

**Clarification Required**

|   |
| - |

|   |
| - |

|   |
| - |

---

# 5. Leave Application

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

LV-APP-01

|   |
| - |

Employees shall be able to submit a leave application.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-02

|   |
| - |

Employee name shall be auto-populated.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-03

|   |
| - |

Department/team shall be auto-populated.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-04

|   |
| - |

Reporting manager shall be auto-populated.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-05

|   |
| - |

Employee shall select a configured leave type.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-06

|   |
| - |

Employee shall provide a leave start date.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-07

|   |
| - |

Employee shall provide a leave end date where applicable.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-08

|   |
| - |

Employee shall select the leave duration/type: Half Day, Full Day, or Multiple Days.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-09

|   |
| - |

The system shall automatically calculate the number of leave days.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-10

|   |
| - |

Employee shall provide a reason for leave.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-11

|   |
| - |

Employee shall upload supporting documentation when required.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-12

|   |
| - |

Employee shall be able to submit the completed application.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-13

|   |
| - |

The system shall validate required fields before submission.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-14

|   |
| - |

The system shall validate leave dates before submission.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-15

|   |
| - |

The system shall validate overlapping leave before submission.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-16

|   |
| - |

The system shall validate medical-document requirements before submission.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-17

|   |
| - |

Employees shall be able to view the status of their submitted leave applications.

|   |
| - |

**Confirmed**

|   |
| - |

LV-APP-18

|   |
| - |

Leave approval workflow in case of HR absence

|   |
| - |

**Confirmed**

---

# 6. Leave Duration & Date Calculation

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

LV-DUR-01

|   |
| - |

The system shall support Half-Day Leave.

|   |
| - |

**Confirmed**

|   |
| - |

LV-DUR-02

|   |
| - |

Half-Day Leave shall support First Half and Second Half.

|   |
| - |

**Confirmed**

|   |
| - |

LV-DUR-03

|   |
| - |

The system shall support Full-Day Leave.

|   |
| - |

**Confirmed**

|   |
| - |

LV-DUR-04

|   |
| - |

Full-Day Leave shall apply to a single date.

|   |
| - |

**Confirmed**

|   |
| - |

LV-DUR-05

|   |
| - |

The system shall support Multiple-Day Leave using a start and end date.

|   |
| - |

**Confirmed**

|   |
| - |

LV-DUR-06

|   |
| - |

The system shall calculate the leave duration automatically.

|   |
| - |

**Confirmed**

|   |
| - |

LV-DUR-07

|   |
| - |

The system shall support configurable inclusion/exclusion of weekends in leave calculations.

|   |
| - |

**Confirmed**

|   |
| - |

LV-DUR-08

|   |
| - |

The system shall support configurable inclusion/exclusion of public holidays in leave calculations.

|   |
| - |

**Confirmed**

|   |
| - |

LV-DUR-09

|   |
| - |

Starting 4 hours - first half then remaining 4 hours are counted as second half

|   |
| - |

**Confirmed**

---

# 7. Leave Date Eligibility

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

LV-DATE-01

|   |
| - |

The system shall prevent submission without required leave dates.

|   |
| - |

**Confirmed**

|   |
| - |

LV-DATE-02

|   |
| - |

The system shall validate whether requested dates are eligible for leave.

|   |
| - |

**Confirmed**

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

LV-DATE-06

|   |
| - |

The system shall define how far in advance employees may apply for leave. - 1/2  week max

|   |
| - |

**Confirmed**

|   |
| - |

LV-DATE-07

|   |
| - |

The system shall define or validate whether advance-application limits differ by leave type.

|   |
| - |

**Confirmed**

|   |
| - |

|   |
| - |

|   |
| - |

---

# 8. Leave Overlap

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

LV-OVR-01

|   |
| - |

The system shall prevent employees from submitting overlapping leave applications.

|   |
| - |

**Confirmed**

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

LV-OVR-03

|   |
| - |

The system shall define whether Draft applications participate in overlap validation.

|   |
| - |

**Confirmed**

|   |
| - |

LV-OVR-04

|   |
| - |

The system shall define whether Rejected, Cancelled, or Withdrawn applications participate in overlap validation.

|   |
| - |

**Confirmed**

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

---

# 9. Medical Leave & Documents

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

MED-01

|   |
| - |

Medical documentation shall be supported for medical leave where required.

|   |
| - |

**Confirmed**

|   |
| - |

MED-02

|   |
| - |

Medical documentation shall be mandatory for medical leave exceeding two days.

|   |
| - |

**Confirmed**

|   |
| - |

MED-03

|   |
| - |

The system shall prevent submission when mandatory medical documentation has not been provided.

|   |
| - |

**Confirmed**

|   |
| - |

MED-04

|   |
| - |

Medical documentation may be optional for medical leave of 1–2 days depending on company policy.

|   |
| - |

**Confirmed**

|   |
| - |

MED-05

|   |
| - |

Supported document formats shall include PDF, JPG, JPEG, and PNG.

|   |
| - |

**Confirmed**

|   |
| - |

MED-06

|   |
| - |

The system shall define the maximum permitted file size.

|   |
| - |

**Clarification Required**

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

MED-09

|   |
| - |

Only HR/ Admin may view/download medical documents.

|   |
| - |

**Confirm**

|   |
| - |

MED-10

|   |
| - |

The system shall define document retention requirements.

|   |
| - |

**Clarification Required**

|   |
| - |

MED-11

|   |
| - |

Medical document has to be submitted  if an employee cannot/will not provide medical documentation w/o any alternative

|   |
| - |

**Confirmed**

|   |
| - |

MED-12

|   |
| - |

The exact meaning of “exceeding two days” shall be defined, including treatment of weekends and holidays.

|   |
| - |

**Clarification Required**

---

# 10. Leave Approval Workflow

### Current workflow

**Reporting Manager approval outside application → Employee submits → HR/Admin reviews → Approve / Reject / Request Clarification**

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

LV-WF-01

|   |
| - |

Reporting Manager approval shall occur outside the application.

|   |
| - |

**Confirmed**

|   |
| - |

LV-WF-02

|   |
| - |

Employee shall submit the leave application after obtaining manager approval.

|   |
| - |

**Confirmed**

|   |
| - |

LV-WF-03

|   |
| - |

The system shall validate the application before submission/review.

|   |
| - |

**Confirmed**

|   |
| - |

LV-WF-04

|   |
| - |

HR/Admin shall be able to review the complete application.

|   |
| - |

**Confirmed**

|   |
| - |

LV-WF-05

|   |
| - |

HR/Admin shall be able to Approve a leave application.

|   |
| - |

**Confirmed**

|   |
| - |

LV-WF-06

|   |
| - |

HR/Admin shall be able to Reject a leave application.

|   |
| - |

**Confirmed**

|   |
| - |

LV-WF-07

|   |
| - |

HR/Admin shall be able to Request Clarification.

|   |
| - |

**Confirmed**

|   |
| - |

LV-WF-08

|   |
| - |

The system shall track the leave application's lifecycle/status.

|   |
| - |

**Confirmed**

|   |
| - |

LV-WF-09

|   |
| - |

HR requires proof of external manager approval

|   |
| - |

**Confirmed**

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

LV-WF-13

|   |
| - |

 approval path for employees without a reporting manager - directly getting it approved by the HR

|   |
| - |

**Confirmed**

---

# 11. Leave Status & Lifecycle

The BRD currently defines:
**Draft → Submitted → Pending HR Review → Approved / Rejected / Cancelled / Withdrawn**

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

LV-STS-01

|   |
| - |

The system shall support Draft status.

|   |
| - |

**Confirmed**

|   |
| - |

LV-STS-02

|   |
| - |

The system shall support Submitted status.

|   |
| - |

**Confirmed**

|   |
| - |

LV-STS-03

|   |
| - |

The system shall support Pending HR Review status.

|   |
| - |

**Confirmed**

|   |
| - |

LV-STS-04

|   |
| - |

The system shall support Approved status.

|   |
| - |

**Confirmed**

|   |
| - |

LV-STS-05

|   |
| - |

The system shall support Rejected status.

|   |
| - |

**Confirmed**

|   |
| - |

LV-STS-06

|   |
| - |

The system shall support Cancelled status.

|   |
| - |

**Confirmed**

|   |
| - |

LV-STS-07

|   |
| - |

The system shall support Withdrawn status.

|   |
| - |

**Confirmed**

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

LV-STS-10

|   |
| - |

If an approved leave is cancelled/withdrawn - correction request

|   |
| - |

**Confirmed**

|   |
| - |

|   |
| - |

|   |
| - |

---

# 12. Attendance — Check-In / Check-Out

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

AT-01

|   |
| - |

Employees shall be able to record daily Check-In/Login.

|   |
| - |

**Confirmed**

|   |
| - |

AT-02

|   |
| - |

The system shall record the Check-In date and exact login time.

|   |
| - |

**Confirmed**

|   |
| - |

AT-03

|   |
| - |

The Check-In record shall be associated with the employee.

|   |
| - |

**Confirmed**

|   |
| - |

AT-04

|   |
| - |

Employees shall be able to record daily Check-Out/Logout.

|   |
| - |

**Confirmed**

|   |
| - |

AT-05

|   |
| - |

The system shall record the Check-Out time.

|   |
| - |

**Confirmed**

|   |
| - |

AT-06

|   |
| - |

The system shall prevent duplicate Check-In actions.

|   |
| - |

**Proposed**

|   |
| - |

AT-07

|   |
| - |

The system shall prevent duplicate Check-Out actions.

|   |
| - |

**Proposed**

|   |
| - |

AT-08

|   |
| - |

The system shall prevent Check-Out when there is no valid Check-In.

|   |
| - |

**Proposed**

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

### Expected button behavior — Proposed

|   |
| - |

Attendance State
Check-In
Check-Out

|   |
| - |

Not checked in

|   |
| - |

**Enabled**

|   |
| - |

Disabled

|   |
| - |

Checked in

|   |
| - |

Disabled

|   |
| - |

**Enabled**

|   |
| - |

Checked out

|   |
| - |

Disabled

|   |
| - |

Disabled

---

# 13. Working Hours, Shifts & Attendance Calculation

---

# 14. Attendance Status

The system shall support the following attendance classifications:

|   |
| - |

Status
Status
Notes

|   |
| - |

Present

|   |
| - |

**Confirmed**

|   |
| - |

Exact qualification requires clarification

|   |
| - |

Absent

|   |
| - |

**Confirmed**

|   |
| - |

Exact qualification requires clarification

|   |
| - |

On Leave

|   |
| - |

**Confirmed**

|   |
| - |

Based on approved leave

|   |
| - |

Half-Day

|   |
| - |

**Confirmed**

|   |
| - |

Exact calculation requires clarification

|   |
| - |

Holiday

|   |
| - |

**Confirmed**

|   |
| - |

Holiday source/calendar requires clarification

|   |
| - |

Weekly Off

|   |
| - |

**Confirmed**

|   |
| - |

Weekly-off rules require clarification

|   |
| - |

Missing Check-In

|   |
| - |

**Confirmed**

|   |
| - |

Exact trigger requires clarification

|   |
| - |

Missing Check-Out

|   |
| - |

**Confirmed**

|   |
| - |

Exact trigger requires clarification

### Additional clarification

The business must define what happens when an employee **does not attend work and has no approved leave**:

- Absent?
- Unauthorized absence?
- Missing Attendance?
- Something else?

---

# 15. Attendance Dashboard — Employee

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

AT-DASH-01

|   |
| - |

Employee shall be able to view today's attendance status.

|   |
| - |

**Confirmed**

|   |
| - |

AT-DASH-02

|   |
| - |

Employee shall be able to view login time.

|   |
| - |

**Confirmed**

|   |
| - |

AT-DASH-03

|   |
| - |

Employee shall be able to view logout time.

|   |
| - |

**Confirmed**

|   |
| - |

AT-DASH-04

|   |
| - |

Employee shall be able to view monthly attendance summary.

|   |
| - |

**Confirmed**

|   |
| - |

AT-DASH-05

|   |
| - |

Employee shall be able to view present-day count.

|   |
| - |

**Confirmed**

|   |
| - |

AT-DASH-06

|   |
| - |

Employee shall be able to view absent-day count.

|   |
| - |

**Confirmed**

|   |
| - |

AT-DASH-07

|   |
| - |

Employee shall be able to view leave-day count.

|   |
| - |

**Confirmed**

|   |
| - |

AT-DASH-08

|   |
| - |

Employee shall be able to view late-login records.

|   |
| - |

**Confirmed**

|   |
| - |

AT-DASH-09

|   |
| - |

Employee shall be able to view missing attendance records.

|   |
| - |

**Confirmed**

|   |
| - |

AT-DASH-10

|   |
| - |

 date range/timezone used by the dashboard is EST

|   |
| - |

**Confirmed**

---

# 16. Attendance Correction

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

AT-COR-01

|   |
| - |

Employees shall be able to submit an attendance correction request.

|   |
| - |

**Confirmed**

|   |
| - |

AT-COR-02

|   |
| - |

A correction request shall include the affected date.

|   |
| - |

**Confirmed**

|   |
| - |

AT-COR-03

|   |
| - |

A correction request shall include the correction type.

|   |
| - |

**Confirmed**

|   |
| - |

AT-COR-04

|   |
| - |

A correction request may specify the correct login time.

|   |
| - |

**Confirmed**

|   |
| - |

AT-COR-05

|   |
| - |

A correction request may specify the correct logout time.

|   |
| - |

**Confirmed**

|   |
| - |

AT-COR-06

|   |
| - |

A correction request shall include a reason.

|   |
| - |

**Confirmed**

|   |
| - |

AT-COR-07

|   |
| - |

Supporting documentation shall be allowed/required where applicable.

|   |
| - |

**Confirmed**

|   |
| - |

AT-COR-08

|   |
| - |

HR/Admin shall review correction requests.

|   |
| - |

**Confirmed**

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

AT-COR-10

|   |
| - |

Employees shall not directly modify attendance records.

|   |
| - |

**Confirmed**

|   |
| - |

AT-COR-11

|   |
| - |

HR/Admin can directly modify attendance without a correction request.

|   |
| - |

**Confirmed**

|   |
| - |

AT-COR-12

|   |
| - |

Any changes made by HR/Admin should be kept as a record

|   |
| - |

**Proposed**

|   |
| - |

|   |
| - |

|   |
| - |

---

# 17. Leave ↔ Attendance Integration

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

INT-01

|   |
| - |

Approved leave shall automatically reflect in the employee's attendance record as On Leave.

|   |
| - |

**Confirmed**

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

INT-03

|   |
| - |

 when leave is approved after attendance has already been recorded - correction request

|   |
| - |

**Confirmed**

---

# 18. Holidays & Weekly Offs

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

CAL-01

|   |
| - |

HR/Admin shall be able to configure public holidays.

|   |
| - |

**Confirmed**

|   |
| - |

CAL-02

|   |
| - |

HR/Admin shall be able to configure weekly offs.

|   |
| - |

**Confirmed**

|   |
| - |

CAL-03

|   |
| - |

The system shall use configured holidays when calculating leave/attendance.

|   |
| - |

**Confirmed**

|   |
| - |

CAL-07

|   |
| - |

holidays and weekly offs does not participate in sandwich-leave calculations.

|   |
| - |

**Confirmed**

---

# 19. Time Zone & Date Handling

> **Critical requirement area**, particularly for shifts such as **18:30–02:30**.

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

TZ-01

|   |
| - |

The system shall use a defined authoritative timezone for attendance timestamps.

|   |
| - |

**Proposed**

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

TZ-04

|   |
| - |

The timezone used for reports/ notification and reminder - EST

|   |
| - |

**Confirm**

> **Important:** “Date should depend on phone/device” should **not** automatically be treated as a final requirement. The business must decide the authoritative source because device time can be changed by the user.

---

# 20. HR/Admin Dashboard

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

HR-DASH-01

|   |
| - |

Display total employees.

|   |
| - |

**Confirmed**

|   |
| - |

HR-DASH-02

|   |
| - |

Display employees present today.

|   |
| - |

**Confirmed**

|   |
| - |

HR-DASH-03

|   |
| - |

Display employees on leave today.

|   |
| - |

**Confirmed**

|   |
| - |

HR-DASH-04

|   |
| - |

Display employees absent today.

|   |
| - |

**Confirmed**

|   |
| - |

HR-DASH-05

|   |
| - |

Display employees who have not marked attendance.

|   |
| - |

**Confirmed**

|   |
| - |

HR-DASH-06

|   |
| - |

Display late logins.

|   |
| - |

**Confirmed**

|   |
| - |

HR-DASH-07

|   |
| - |

Display missing check-outs.

|   |
| - |

**Confirmed**

|   |
| - |

HR-DASH-08

|   |
| - |

Display pending leave applications.

|   |
| - |

**Confirmed**

|   |
| - |

HR-DASH-09

|   |
| - |

 dashboard timezone/date basis - EST

|   |
| - |

**Confirmed**

---

# 21. Notifications

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

NOTIF-01

|   |
| - |

Notify HR/Admin when a leave is submitted.

|   |
| - |

**Confirmed**

|   |
| - |

NOTIF-02

|   |
| - |

Notify employee when leave is approved.

|   |
| - |

**Confirmed**

|   |
| - |

NOTIF-03

|   |
| - |

Notify employee when leave is rejected.

|   |
| - |

**Confirmed**

|   |
| - |

NOTIF-04

|   |
| - |

Include HR comments with rejection notification.

|   |
| - |

**Confirmed**

|   |
| - |

NOTIF-05

|   |
| - |

Notify employee when a required medical document is missing before submission.

|   |
| - |

**Confirmed**

|   |
| - |

NOTIF-06

|   |
| - |

Remind employees when attendance has not been marked.

|   |
| - |

**Confirmed**

|   |
| - |

NOTIF-07

|   |
| - |

Remind employees about missing logout.

|   |
| - |

**Confirmed**

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

NOTIF-10

|   |
| - |

Support Microsoft Teams/Slack integration.

|   |
| - |

**Future / Optional**

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

NOTIF-12

|   |
| - |

Define reminder schedules and timing - for late check in and out

|   |
| - |

**Clarification Required**

|   |
| - |

|   |
| - |

|   |
| - |

---

# 22. Reports

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

REP-01

|   |
| - |

Generate employee-wise leave reports.

|   |
| - |

**Confirmed**

|   |
| - |

REP-02

|   |
| - |

Generate department-wise leave reports.

|   |
| - |

**Confirmed**

|   |
| - |

REP-03

|   |
| - |

Generate monthly leave reports.

|   |
| - |

**Confirmed**

|   |
| - |

REP-04

|   |
| - |

Generate leave-type-wise reports.

|   |
| - |

**Confirmed**

|   |
| - |

REP-05

|   |
| - |

Generate approved/rejected leave reports.

|   |
| - |

**Confirmed**

|   |
| - |

REP-06

|   |
| - |

Generate daily attendance reports.

|   |
| - |

**Confirmed**

|   |
| - |

REP-07

|   |
| - |

Generate monthly attendance reports.

|   |
| - |

**Confirmed**

|   |
| - |

REP-08

|   |
| - |

Generate employee-wise attendance reports.

|   |
| - |

**Confirmed**

|   |
| - |

REP-09

|   |
| - |

Generate late-login reports.

|   |
| - |

**Confirmed**

|   |
| - |

REP-10

|   |
| - |

Generate missing-logout reports.

|   |
| - |

**Confirmed**

|   |
| - |

REP-11

|   |
| - |

Export reports in Excel format.

|   |
| - |

**Confirmed**

|   |
| - |

REP-12

|   |
| - |

Export reports in CSV format.

|   |
| - |

**Confirmed**

|   |
| - |

REP-13

|   |
| - |

Export reports in PDF format.

|   |
| - |

**Confirmed**

|   |
| - |

REP-14

|   |
| - |

Define report filters such as date range, employee, department, and leave type.

|   |
| - |

**Clarification Required**

|   |
| - |

REP-15

|   |
| - |

Define report access permissions.

|   |
| - |

**Clarification Required**

|   |
| - |

REP-16

|   |
| - |

Define treatment of cancelled, withdrawn, rejected, and corrected records in reports.

|   |
| - |

**Clarification Required**

|   |
| - |

|   |
| - |

|   |
| - |

---

# 23. Audit Log

|   |
| - |

ID
Functional Requirement
Status

|   |
| - |

AUD-01

|   |
| - |

The system shall record every change in an audit log.

|   |
| - |

**Confirmed**

|   |
| - |

AUD-02

|   |
| - |

Leave creation, modification, submission, approval, rejection, cancellation, and withdrawal shall be considered for audit logging.

|   |
| - |

**Proposed — confirm scope**

|   |
| - |

AUD-03

|   |
| - |

Attendance check-in/check-out and correction actions shall be considered for audit logging.

|   |
| - |

**Proposed — confirm scope**

|   |
| - |

AUD-04

|   |
| - |

Employee, policy, holiday, role, and permission changes shall be considered for audit logging.

|   |
| - |

**Proposed — confirm scope**

|   |
| - |

AUD-05

|   |
| - |

The audit record should identify who performed the action.

|   |
| - |

**Proposed**

|   |
| - |

AUD-06

|   |
| - |

The audit record should identify when the action occurred.

|   |
| - |

**Proposed**

|   |
| - |

AUD-07

|   |
| - |

The audit record should capture the relevant before/after change where applicable.

|   |
| - |

**Proposed**

|   |
| - |

AUD-08

|   |
| - |

The system shall define whether audit records are visible to HR/Admin and/or only administrators.

|   |
| - |

**Clarification Required**

---

# 24. Functional Requirements — Edge Cases

|   |
| - |

ID
Scenario
Required Decision

|   |
| - |

EDGE-01

|   |
| - |

Employee has no reporting manager

|   |
| - |

Who approves the leave?

|   |
| - |

EDGE-02

|   |
| - |

Employee has no department

|   |
| - |

What appears in the application/report?

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

EDGE-09

|   |
| - |

Employee checks in and applies for same-day leave

|   |
| - |

Define attendance/leave interaction.

|   |
| - |

EDGE-10

|   |
| - |

Approved leave is later cancelled

|   |
| - |

Define resulting attendance status.

|   |
| - |

EDGE-11

|   |
| - |

Leave spans a month boundary

|   |
| - |

Define balance/report treatment.

|   |
| - |

EDGE-12

|   |
| - |

Leave spans a weekend/holiday

|   |
| - |

Define calculation.

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

EDGE-14

|   |
| - |

Employee takes leave without prior notification

|   |
| - |

Define unauthorized/backdated leave behavior.

|   |
| - |

|   |
| - |

|   |
| - |

---

# 25. Business Rules

These are the actual behavioral rules currently supported by the BRD. Items marked **Proposed** should not be implemented until confirmed.

|   |
| - |

ID
Business Rule
Status

|   |
| - |

BR-01

|   |
| - |

Leave cannot be submitted without required dates.

|   |
| - |

**Confirmed**

|   |
| - |

BR-02

|   |
| - |

Leave cannot be submitted without a reason.

|   |
| - |

**Confirmed**

|   |
| - |

BR-03

|   |
| - |

Medical documentation is mandatory for medical leave exceeding two days.

|   |
| - |

**Confirmed**

|   |
| - |

BR-04

|   |
| - |

Submission shall be blocked when mandatory medical documentation is missing.

|   |
| - |

**Confirmed**

|   |
| - |

BR-05

|   |
| - |

Medical documentation for 1–2 days may be optional according to company policy.

|   |
| - |

**Confirmed**

|   |
| - |

BR-06

|   |
| - |

Medical-document uploads support PDF, JPG, JPEG, and PNG.

|   |
| - |

**Confirmed**

|   |
| - |

BR-07

|   |
| - |

Employees cannot submit overlapping leave.

|   |
| - |

**Confirmed**

|   |
| - |

BR-08

|   |
| - |

Weekend/public-holiday inclusion in leave calculation is configurable.

|   |
| - |

**Confirmed**

|   |
| - |

BR-09

|   |
| - |

Approved leave shall automatically reflect as On Leave in attendance.

|   |
| - |

**Confirmed**

|   |
| - |

BR-10

|   |
| - |

Employees cannot directly modify attendance records.

|   |
| - |

**Confirmed**

|   |
| - |

BR-11

|   |
| - |

Attendance changes should occur through the correction-request process.

|   |
| - |

**Confirmed**

|   |
| - |

BR-12

|   |
| - |

Every change shall be recorded in an audit log.

|   |
| - |

**Confirmed**

|   |
| - |

BR-13

|   |
| - |

Employees can view only their own leave and attendance records.

|   |
| - |

**Confirmed**

|   |
| - |

BR-14

|   |
| - |

HR/Admin has organization-wide access.

|   |
| - |

**Confirmed**

|   |
| - |

BR-15

|   |
| - |

Reporting-manager approval occurs outside the application.

|   |
| - |

**Confirmed**

|   |
| - |

BR-16

|   |
| - |

HR/Admin reviews the leave after external manager confirmation.

|   |
| - |

**Confirmed**

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

BR-18

|   |
| - |

Duplicate Check-In/Check-Out actions should be prevented.

|   |
| - |

**Proposed**

|   |
| - |

BR-19

|   |
| - |

Check-Out should not be possible without a valid Check-In.

|   |
| - |

**Proposed**

|   |
| - |

BR-20

|   |
| - |

HR should only modify attendance through an approved correction workflow.

|   |
| - |

**Proposed — business confirmation required**

|   |
| - |

BR-21

|   |
| - |

Attendance timestamps should use an authoritative time source rather than untrusted device time.

|   |
| - |

**Proposed — business/technical decision required**

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

BR-23

|   |
| - |

Leave balance is eligibility, while HR approval is authorization if the organization uses leave balances.

|   |
| - |

**Proposed — business confirmation required**

---

# 27. MVP Scope — Current BRD

Until clarification is completed, the **current intended MVP** can be represented as:

|   |
| - |

Module
Current MVP Requirement
Status

|   |
| - |

Leave

|   |
| - |

Leave application

|   |
| - |

**Confirmed**

|   |
| - |

Leave

|   |
| - |

Half-day/full-day/multiple-day leave

|   |
| - |

**Confirmed**

|   |
| - |

Leave

|   |
| - |

Leave reason

|   |
| - |

**Confirmed**

|   |
| - |

Leave

|   |
| - |

Medical document upload

|   |
| - |

**Confirmed**

|   |
| - |

Leave

|   |
| - |

HR approval/rejection

|   |
| - |

**Confirmed**

|   |
| - |

Leave

|   |
| - |

Leave status tracking

|   |
| - |

**Confirmed**

|   |
| - |

Attendance

|   |
| - |

Daily Check-In

|   |
| - |

**Confirmed**

|   |
| - |

Attendance

|   |
| - |

Daily Check-Out

|   |
| - |

**Confirmed**

|   |
| - |

Attendance

|   |
| - |

Attendance history

|   |
| - |

**Confirmed**

|   |
| - |

Attendance

|   |
| - |

Attendance correction request

|   |
| - |

**Confirmed**

|   |
| - |

HR/Admin

|   |
| - |

Employee management

|   |
| - |

**Confirmed**

|   |
| - |

HR/Admin

|   |
| - |

Leave review/approval

|   |
| - |

**Confirmed**

|   |
| - |

HR/Admin

|   |
| - |

Attendance dashboard

|   |
| - |

**Confirmed**

|   |
| - |

HR/Admin

|   |
| - |

Leave & attendance reports

|   |
| - |

**Confirmed**

|   |
| - |

Policy

|   |
| - |

Leave balance/entitlement

|   |
| - |

**Not defined yet**

|   |
| - |

Policy

|   |
| - |

Accrual/carry-forward

|   |
| - |

**Not defined yet**

|   |
| - |

Policy

|   |
| - |

Maternity/Paternity etc.

|   |
| - |

**Not defined yet**

|   |
| - |

Authentication

|   |
| - |

SSO/login/session rules

|   |
| - |

**Not defined yet**

|   |
| - |

Timezone

|   |
| - |

Multi-timezone behavior

|   |
| - |

**Not defined yet**

|   |
| - |

Notifications

|   |
| - |

Channels/schedules

|   |
| - |

**Partially defined**

|   |
| - |

Holiday

|   |
| - |

Exact calendar/location rules

|   |
| - |

**Not defined yet**

---

##

# **Backend requirement traceability**

**Source of truth:** [**Functional** ](https://markdowntoword.io/Functional%20_Requirements_and%20_business_requirements.md)[***Requirements***](https://markdowntoword.io/Functional%20_Requirements_and%20_business_requirements.md)[**and** ](https://markdowntoword.io/Functional%20_Requirements_and%20_business_requirements.md)[***business***](https://markdowntoword.io/Functional%20_Requirements_and%20_business_requirements.md)[**requirements.md**](https://markdowntoword.io/Functional%20_Requirements_and%20_business_requirements.md)
**Status column** is copied from that document. **Confirmed** / **Confirm** are designed. **Proposed**, **Clarification Required**, and **Future** are not implemented as policy.
Impact columns: what the backend must do if the requirement is in scope. `—` means no backend artifact until the status is Confirmed.

---

## **Authentication**

|   |
| - |

**Requirement ID**
**Requirement**
**Backend Impact**
**Database Impact**
**API Impact**
**Workflow Impact**
**Validation/Rule**
**Status**

|   |
| - |

AUTH-01

|   |
| - |

Separate capabilities for Employee and HR/Admin

|   |
| - |

RBAC in Express

|   |
| - |

`users.role`

|   |
| - |

All routes role-gated

|   |
| - |

All workflows

|   |
| - |

AUTHZ

|   |
| - |

Confirmed

|   |
| - |

AUTH-02

|   |
| - |

Employees access own leave and attendance

|   |
| - |

Resource filter `employee_id = token`

|   |
| - |

FK on leave/attendance

|   |
| - |

GET own resources

|   |
| - |

Read paths

|   |
| - |

BR-13

|   |
| - |

Confirmed

|   |
| - |

AUTH-03

|   |
| - |

Employees cannot view others' leave/attendance

|   |
| - |

IDOR checks

|   |
| - |

RLS defense

|   |
| - |

404/403 on foreign ids

|   |
| - |

—

|   |
| - |

BR-13

|   |
| - |

Confirmed

|   |
| - |

AUTH-04

|   |
| - |

HR/Admin org-wide access

|   |
| - |

Admin/guest\_admin org queries

|   |
| - |

—

|   |
| - |

List/filter all employees

|   |
| - |

Dashboards, reports

|   |
| - |

BR-14

|   |
| - |

Confirmed

|   |
| - |

AUTH-05

|   |
| - |

HR/Admin manage employees

|   |
| - |

Employee service

|   |
| - |

`employees`, `users`

|   |
| - |

`/employees`

|   |
| - |

Provisioning

|   |
| - |

AUTH-10

|   |
| - |

Confirmed

|   |
| - |

AUTH-06

|   |
| - |

HR/Admin access medical documents

|   |
| - |

Authz on document GET

|   |
| - |

`documents` + Storage

|   |
| - |

`GET /documents/{id}`

|   |
| - |

Review leave

|   |
| - |

MED-09

|   |
| - |

Confirmed

|   |
| - |

AUTH-07

|   |
| - |

HR/Admin generate reports

|   |
| - |

Report service

|   |
| - |

indexes on dates

|   |
| - |

`/reports/*`

|   |
| - |

Export

|   |
| - |

REP-01–13

|   |
| - |

Confirmed

|   |
| - |

AUTH-08

|   |
| - |

Distinguish HR vs Admin read-only if separate

|   |
| - |

Map to `guest_admin`

|   |
| - |

role enum

|   |
| - |

Read vs write routes

|   |
| - |

Guest cannot mutate

|   |
| - |

See AUTH-09

|   |
| - |

Confirmed

|   |
| - |

AUTH-09

|   |
| - |

Three roles: employee, admin, guest admin

|   |
| - |

Role enum + permission matrix

|   |
| - |

`users.role` CHECK

|   |
| - |

Auth + every route

|   |
| - |

All

|   |
| - |

AUTH-08+09

|   |
| - |

Confirmed

|   |
| - |

AUTH-10

|   |
| - |

Email/password, session expiry, password mgmt, provisioning

|   |
| - |

Supabase Auth + Express JWT

|   |
| - |

`auth.users` + `users`

|   |
| - |

`/auth/*`, employee create

|   |
| - |

Login, invite

|   |
| - |

Technical: expiry values

|   |
| - |

Confirmed

---

## **Authorization / RBAC**

Covered by AUTH-01–09, BR-13, BR-14, MED-09. Permission matrix: [**authentication-authorization.md**](https://markdowntoword.io/authentication-authorization.md).

---

## **Employee management / departments / reporting**

|   |
| - |

**Requirement ID**
**Requirement**
**Backend Impact**
**Database Impact**
**API Impact**
**Workflow Impact**
**Validation/Rule**
**Status**

|   |
| - |

EMP-01

|   |
| - |

Manage employee records

|   |
| - |

CRUD + deactivate

|   |
| - |

`employees`

|   |
| - |

`/employees`

|   |
| - |

Provisioning

|   |
| - |

AUTH-05

|   |
| - |

Confirmed

|   |
| - |

EMP-02

|   |
| - |

Auto-display employee name on leave form

|   |
| - |

Snapshot/read from employee

|   |
| - |

`employees.full_name`

|   |
| - |

Leave GET/POST response

|   |
| - |

Leave apply

|   |
| - |

—

|   |
| - |

Confirmed

|   |
| - |

EMP-03

|   |
| - |

Auto-display department/team

|   |
| - |

Single `department` field

|   |
| - |

`employees.department` nullable

|   |
| - |

Leave DTO

|   |
| - |

Leave apply

|   |
| - |

EMP-06

|   |
| - |

Confirmed

|   |
| - |

EMP-04

|   |
| - |

Auto-display reporting manager

|   |
| - |

FK snapshot at submit

|   |
| - |

`reporting_manager_employee_id`

|   |
| - |

Leave DTO

|   |
| - |

Leave apply

|   |
| - |

LV-WF-13

|   |
| - |

Confirmed

|   |
| - |

EMP-06

|   |
| - |

Employees without department or reporting manager allowed

|   |
| - |

Nullable FKs/fields

|   |
| - |

NULLs allowed

|   |
| - |

Create employee

|   |
| - |

LV-WF-13 HR-direct

|   |
| - |

EDGE-01/02

|   |
| - |

Confirmed

---

## **Leave types / policies / balances**

|   |
| - |

**Requirement ID**
**Requirement**
**Backend Impact**
**Database Impact**
**API Impact**
**Workflow Impact**
**Validation/Rule**
**Status**

|   |
| - |

LV-TYPE-01

|   |
| - |

Configurable leave types

|   |
| - |

Type admin service

|   |
| - |

`leave_types`

|   |
| - |

`/leave-types`

|   |
| - |

Apply select

|   |
| - |

—

|   |
| - |

Confirmed

|   |
| - |

LV-TYPE-02

|   |
| - |

Casual, Sick, Emergency, Planned

|   |
| - |

Seed data

|   |
| - |

rows

|   |
| - |

GET list

|   |
| - |

—

|   |
| - |

—

|   |
| - |

Confirmed

|   |
| - |

LV-TYPE-03

|   |
| - |

HR/Admin manage types

|   |
| - |

Admin APIs

|   |
| - |

`leave_types`

|   |
| - |

POST/PATCH/DELETE

|   |
| - |

Config

|   |
| - |

LV-TYPE-04

|   |
| - |

Confirmed

|   |
| - |

LV-TYPE-04

|   |
| - |

Create, edit, deactivate, or delete

|   |
| - |

Soft-deactivate preferred if referenced

|   |
| - |

`is_active`; delete only if unused

|   |
| - |

POST/PATCH/DELETE

|   |
| - |

Config

|   |
| - |

FK restrict

|   |
| - |

Confirmed

|   |
| - |

LV-TYPE-05

|   |
| - |

Additional types (Unpaid, Maternity, etc.) via configuration

|   |
| - |

No hardcoded extra types; HR can create

|   |
| - |

`leave_types` + eligibility flags

|   |
| - |

Type admin

|   |
| - |

Apply

|   |
| - |

LV-TYPE-06/07

|   |
| - |

Confirmed

|   |
| - |

LV-TYPE-06

|   |
| - |

Different employees / types; males cannot apply for maternity

|   |
| - |

Eligibility on type (gender)

|   |
| - |

`employees.sex`, `leave_types.allowed_sex`

|   |
| - |

Submit validation

|   |
| - |

Apply

|   |
| - |

422 WRONG\_LEAVE\_TYPE

|   |
| - |

Confirmed

|   |
| - |

LV-TYPE-07

|   |
| - |

Leaves usually paid; without prior information → unpaid

|   |
| - |

Paid flag + unpaid rule on submit

|   |
| - |

`leave_types.is_paid`, `leave_applications.is_paid`

|   |
| - |

Submit

|   |
| - |

Apply

|   |
| - |

BR unpaid interpretation

|   |
| - |

Confirmed

|   |
| - |

LV-BAL-08

|   |
| - |

Leave eligibility during probation

|   |
| - |

**No balance module**

|   |
| - |

—

|   |
| - |

—

|   |
| - |

—

|   |
| - |

—

|   |
| - |

Clarification Required

|   |
| - |

LV-BAL-09

|   |
| - |

Leave eligibility during notice period

|   |
| - |

**No balance module**

|   |
| - |

—

|   |
| - |

—

|   |
| - |

—

|   |
| - |

—

|   |
| - |

Clarification Required
**Balances:** The requirements state the BRD does **not** define a leave-balance system. **No balance tables, no balance APIs.**

---

## **Leave applications / duration / dates / overlap**

|   |
| - |

**Requirement ID**
**Requirement**
**Backend Impact**
**Database Impact**
**API Impact**
**Workflow Impact**
**Validation/Rule**
**Status**

|   |
| - |

LV-APP-01–12

|   |
| - |

Submit form fields + submit action

|   |
| - |

Leave service

|   |
| - |

`leave_applications`

|   |
| - |

`POST /leaves`, draft PATCH

|   |
| - |

Apply

|   |
| - |

BR-01, BR-02

|   |
| - |

Confirmed

|   |
| - |

LV-APP-13–16

|   |
| - |

Validate required fields, dates, overlap, medical docs

|   |
| - |

Domain validation

|   |
| - |

CHECKs + query

|   |
| - |

422/409

|   |
| - |

Submit TX

|   |
| - |

BR-01–07

|   |
| - |

Confirmed

|   |
| - |

LV-APP-17

|   |
| - |

View own leave status

|   |
| - |

List/get

|   |
| - |

status column

|   |
| - |

`GET /leaves`

|   |
| - |

—

|   |
| - |

AUTH-02

|   |
| - |

Confirmed

|   |
| - |

LV-APP-18

|   |
| - |

Approval workflow if HR absent

|   |
| - |

**Undefined behavior**

|   |
| - |

—

|   |
| - |

—

|   |
| - |

OPEN

|   |
| - |

OPEN

|   |
| - |

Confirmed (gap)

|   |
| - |

LV-DUR-01–06

|   |
| - |

Half (first/second), full (single date), multi-day auto days

|   |
| - |

Duration logic

|   |
| - |

duration\_mode, half\_session, calculated\_days

|   |
| - |

POST body

|   |
| - |

Calculate

|   |
| - |

LV-DUR-09

|   |
| - |

Confirmed

|   |
| - |

LV-DUR-07–08

|   |
| - |

Configurable weekend/holiday include/exclude in day count

|   |
| - |

Org settings

|   |
| - |

`org_settings` flags

|   |
| - |

GET org-settings

|   |
| - |

Day-count

|   |
| - |

BR-08

|   |
| - |

Confirmed

|   |
| - |

LV-DUR-09

|   |
| - |

First 4 hours = first half; remaining 4 hours = second half

|   |
| - |

Half-day clock bounds

|   |
| - |

uses `work_start` + 4h

|   |
| - |

Attendance/leave

|   |
| - |

Half-day

|   |
| - |

Working hours

|   |
| - |

Confirmed

|   |
| - |

LV-DATE-01

|   |
| - |

Prevent submit without dates

|   |
| - |

Validation

|   |
| - |

NOT NULL dates

|   |
| - |

422

|   |
| - |

Submit

|   |
| - |

BR-01

|   |
| - |

Confirmed

|   |
| - |

LV-DATE-02

|   |
| - |

Validate dates eligible for leave

|   |
| - |

Eligibility service

|   |
| - |

holidays, weekly offs

|   |
| - |

422

|   |
| - |

Submit

|   |
| - |

CAL-03, LV-DATE-06

|   |
| - |

Confirmed

|   |
| - |

LV-DATE-06

|   |
| - |

Advance apply max 1/2 week

|   |
| - |

Max advance check

|   |
| - |

`max_advance_days` default 4 calendar days **TD**

|   |
| - |

422 TOO\_FAR\_AHEAD

|   |
| - |

Submit

|   |
| - |

Per-type LV-DATE-07

|   |
| - |

Confirmed

|   |
| - |

LV-DATE-07

|   |
| - |

Advance limits may differ by leave type

|   |
| - |

Per-type override

|   |
| - |

`leave_types.max_advance_days`

|   |
| - |

Type admin + submit

|   |
| - |

Submit

|   |
| - |

Default from LV-DATE-06

|   |
| - |

Confirmed (values OPEN)

|   |
| - |

LV-OVR-01

|   |
| - |

Prevent overlapping leave

|   |
| - |

Overlap query in TX

|   |
| - |

no GiST until OVR-03/04 decided

|   |
| - |

409 LEAVE\_OVERLAP

|   |
| - |

Submit

|   |
| - |

BR-07

|   |
| - |

Confirmed

|   |
| - |

LV-OVR-03

|   |
| - |

Whether Draft participates in overlap

|   |
| - |

**Must be defined; value not given**

|   |
| - |

filter on status

|   |
| - |

Overlap query

|   |
| - |

Submit

|   |
| - |

OPEN

|   |
| - |

Confirmed (gap)

|   |
| - |

LV-OVR-04

|   |
| - |

Whether Rejected/Cancelled/Withdrawn participate

|   |
| - |

**Must be defined; value not given**

|   |
| - |

filter on status

|   |
| - |

Overlap query

|   |
| - |

Submit

|   |
| - |

OPEN

|   |
| - |

Confirmed (gap)

---

## **Medical / documents**

|   |
| - |

**Requirement ID**
**Requirement**
**Backend Impact**
**Database Impact**
**API Impact**
**Workflow Impact**
**Validation/Rule**
**Status**

|   |
| - |

MED-01–04

|   |
| - |

Medical docs where required; mandatory if medical leave > 2 days; optional 1–2 days per policy

|   |
| - |

Submit gate

|   |
| - |

`documents`, type medical flag, org policy flag

|   |
| - |

POST leaves + documents

|   |
| - |

Submit

|   |
| - |

BR-03–05

|   |
| - |

Confirmed

|   |
| - |

MED-05

|   |
| - |

PDF, JPG, JPEG, PNG

|   |
| - |

Content-type + magic bytes

|   |
| - |

CHECK content\_type

|   |
| - |

POST /documents

|   |
| - |

Upload

|   |
| - |

BR-06

|   |
| - |

Confirmed

|   |
| - |

MED-06

|   |
| - |

Max file size

|   |
| - |

Technical cap until business size signed

|   |
| - |

byte\_size

|   |
| - |

422 FILE\_TOO\_LARGE

|   |
| - |

Upload

|   |
| - |

OPEN

|   |
| - |

Clarification Required

|   |
| - |

MED-09

|   |
| - |

Only HR/Admin view/download medical docs

|   |
| - |

Authz; employees cannot GET medical

|   |
| - |

—

|   |
| - |

GET document

|   |
| - |

Review

|   |
| - |

AUTH-06

|   |
| - |

Confirm

|   |
| - |

MED-10

|   |
| - |

Document retention

|   |
| - |

No auto-delete until defined

|   |
| - |

—

|   |
| - |

—

|   |
| - |

—

|   |
| - |

OPEN

|   |
| - |

Clarification Required

|   |
| - |

MED-11

|   |
| - |

No alternative if employee will not provide medical docs

|   |
| - |

Same as BR-04 block

|   |
| - |

—

|   |
| - |

422

|   |
| - |

Submit

|   |
| - |

BR-04

|   |
| - |

Confirmed

|   |
| - |

MED-12

|   |
| - |

Meaning of “exceeding two days” vs weekends/holidays

|   |
| - |

Uses **calculated\_days** (after include/exclude config)

|   |
| - |

calculated\_days

|   |
| - |

Submit

|   |
| - |

Day-count then MED

|   |
| - |

OPEN confirm

|   |
| - |

Clarification Required

---

## **Leave approval / cancellation / status**

|   |
| - |

**Requirement ID**
**Requirement**
**Backend Impact**
**Database Impact**
**API Impact**
**Workflow Impact**
**Validation/Rule**
**Status**

|   |
| - |

LV-WF-01–02

|   |
| - |

Manager approval outside app; then employee submits

|   |
| - |

No manager-in-app approve

|   |
| - |

snapshot manager id

|   |
| - |

Leave form

|   |
| - |

Apply

|   |
| - |

BR-15

|   |
| - |

Confirmed

|   |
| - |

LV-WF-03–06

|   |
| - |

Validate; HR review; approve; reject

|   |
| - |

Leave review service

|   |
| - |

status, hr\_comments

|   |
| - |

approve/reject

|   |
| - |

Review TX

|   |
| - |

BR-16

|   |
| - |

Confirmed

|   |
| - |

LV-WF-07

|   |
| - |

Request clarification

|   |
| - |

Clarification on pending leave (no extra BRD status)

|   |
| - |

comments + flag

|   |
| - |

POST clarify

|   |
| - |

Employee responds

|   |
| - |

LV-STS-03 stays

|   |
| - |

Confirmed

|   |
| - |

LV-WF-08

|   |
| - |

Track lifecycle/status

|   |
| - |

Status + history table

|   |
| - |

status, history

|   |
| - |

GET leave

|   |
| - |

All leave WF

|   |
| - |

LV-STS-\*

|   |
| - |

Confirmed

|   |
| - |

LV-WF-09

|   |
| - |

HR requires proof of external manager approval

|   |
| - |

Required evidence unless no manager

|   |
| - |

proof fields + optional doc

|   |
| - |

POST leaves

|   |
| - |

Submit/review

|   |
| - |

Exception LV-WF-13

|   |
| - |

Confirmed

|   |
| - |

LV-WF-13

|   |
| - |

No reporting manager → HR approves directly

|   |
| - |

Skip proof; HR still reviews

|   |
| - |

nullable manager

|   |
| - |

Submit

|   |
| - |

Review

|   |
| - |

EMP-06

|   |
| - |

Confirmed

|   |
| - |

LV-STS-01–07

|   |
| - |

Draft, Submitted, Pending HR Review, Approved, Rejected, Cancelled, Withdrawn

|   |
| - |

State machine

|   |
| - |

CHECK status

|   |
| - |

draft/submit/cancel/withdraw

|   |
| - |

[**state-machines.md**](https://markdowntoword.io/state-machines.md)

|   |
| - |

Transitions

|   |
| - |

Confirmed

|   |
| - |

LV-STS-10

|   |
| - |

Approved leave cancelled/withdrawn → correction request

|   |
| - |

Side effect on cancel/withdraw

|   |
| - |

create correction or require one

|   |
| - |

cancel/withdraw

|   |
| - |

Attendance revert

|   |
| - |

INT-01 reverse

|   |
| - |

Confirmed

---

## **Attendance / login-logout / working hours / late**

|   |
| - |

**Requirement ID**
**Requirement**
**Backend Impact**
**Database Impact**
**API Impact**
**Workflow Impact**
**Validation/Rule**
**Status**

|   |
| - |

AT-01–05

|   |
| - |

Daily check-in/out; date + exact times; tied to employee

|   |
| - |

Punch APIs, server clock

|   |
| - |

`attendance_days`

|   |
| - |

POST check-in/out

|   |
| - |

Punch

|   |
| - |

BRD §7

|   |
| - |

Confirmed

|   |
| - |

AT-06–08

|   |
| - |

Prevent duplicate in/out; no out without in

|   |
| - |

**Proposed** — recommended as TD, not BR

|   |
| - |

unique day

|   |
| - |

409

|   |
| - |

Punch

|   |
| - |

BR-18/19 Proposed

|   |
| - |

Proposed

|   |
| - |

AT-DASH-01–09

|   |
| - |

Employee dashboard metrics

|   |
| - |

Aggregate queries

|   |
| - |

attendance + leave

|   |
| - |

GET dashboard/me

|   |
| - |

Read

|   |
| - |

Status labels

|   |
| - |

Confirmed

|   |
| - |

AT-DASH-10

|   |
| - |

Dashboard date range/timezone EST

|   |
| - |

All “today” in Eastern

|   |
| - |

org tz America/New\_York

|   |
| - |

dashboards

|   |
| - |

Jobs

|   |
| - |

TZ-04

|   |
| - |

Confirmed

|   |
| - |

Working hours / grace / late

|   |
| - |

BRD §8 configure hours, workdays, weekly offs, holidays, late grace

|   |
| - |

Org settings + late flag

|   |
| - |

`org_settings`, `is_late`

|   |
| - |

org-settings, dashboard

|   |
| - |

Check-in compare

|   |
| - |

Late = after start+grace

|   |
| - |

Confirmed (BRD)

|   |
| - |

Overtime

|   |
| - |

Not in requirements

|   |
| - |

**Out of scope**

|   |
| - |

—

|   |
| - |

none

|   |
| - |

—

|   |
| - |

—

|   |
| - |

Absent

|   |
| - |

AT-COR-01–08,10

|   |
| - |

Employee correction request + HR review; employee cannot direct-edit

|   |
| - |

Correction module

|   |
| - |

`attendance_corrections`

|   |
| - |

/corrections

|   |
| - |

Correction WF

|   |
| - |

BR-10, BR-11

|   |
| - |

Confirmed

|   |
| - |

AT-COR-11

|   |
| - |

Admin **can** directly modify attendance without a correction

|   |
| - |

Admin PATCH attendance

|   |
| - |

punches + audit

|   |
| - |

PATCH attendance

|   |
| - |

Admin edit TX

|   |
| - |

Overrides Proposed BR-20

|   |
| - |

Confirmed

|   |
| - |

AT-COR-12

|   |
| - |

Record HR/Admin attendance changes

|   |
| - |

Audit

|   |
| - |

`audit_events`

|   |
| - |

—

|   |
| - |

Admin edit

|   |
| - |

AUD-01

|   |
| - |

Proposed

---

## **Leave ↔ attendance / holidays / timezone**

|   |
| - |

**Requirement ID**
**Requirement**
**Backend Impact**
**Database Impact**
**API Impact**
**Workflow Impact**
**Validation/Rule**
**Status**

|   |
| - |

INT-01

|   |
| - |

Approved leave → attendance On Leave

|   |
| - |

Approve TX write-back

|   |
| - |

`attendance_days.derived_status`, FK

|   |
| - |

approve

|   |
| - |

Approve

|   |
| - |

BR-09

|   |
| - |

Confirmed

|   |
| - |

INT-03

|   |
| - |

Leave approved after attendance already recorded → correction request

|   |
| - |

Do not silently overwrite punches; create/require correction

|   |
| - |

correction row

|   |
| - |

approve

|   |
| - |

Approve+correct

|   |
| - |

OPEN exact auto-create

|   |
| - |

Confirmed

|   |
| - |

CAL-01–03

|   |
| - |

Configure holidays and weekly offs; use in leave/attendance calc

|   |
| - |

Calendar service

|   |
| - |

`public_holidays`, weekly\_off\_dow

|   |
| - |

holidays, org-settings

|   |
| - |

Day-count, status

|   |
| - |

BR-08

|   |
| - |

Confirmed

|   |
| - |

CAL-07

|   |
| - |

Holidays and weekly offs **do not** participate in sandwich-leave calculations

|   |
| - |

Never auto-fill weekend/holiday as leave

|   |
| - |

day-count skips them for sandwich

|   |
| - |

—

|   |
| - |

Day-count

|   |
| - |

No sandwich fill

|   |
| - |

Confirmed

|   |
| - |

TZ-01

|   |
| - |

Authoritative timezone for attendance timestamps

|   |
| - |

Server/NTP, not device

|   |
| - |

timestamptz UTC

|   |
| - |

punches

|   |
| - |

Punch

|   |
| - |

BR-21 Proposed

|   |
| - |

Proposed

|   |
| - |

TZ-04

|   |
| - |

Reports/notification/reminder timezone EST

|   |
| - |

Display + jobs in Eastern

|   |
| - |

org tz

|   |
| - |

reports, notif

|   |
| - |

Reminders

|   |
| - |

AT-DASH-10

|   |
| - |

Confirm

|   |
| - |

Night shift 18:30–02:30

|   |
| - |

Requirements call out overnight shifts

|   |
| - |

work\_date = Eastern date of check-in **TD**

|   |
| - |

work\_date DATE

|   |
| - |

punches

|   |
| - |

Punch

|   |
| - |

OPEN shift model

|   |
| - |

Noted

---

## **Dashboards / notifications / reports / audit / config / security**

|   |
| - |

**Requirement ID**
**Requirement**
**Backend Impact**
**Database Impact**
**API Impact**
**Workflow Impact**
**Validation/Rule**
**Status**

|   |
| - |

HR-DASH-01–08

|   |
| - |

HR dashboard counts

|   |
| - |

Aggregates in Eastern “today”

|   |
| - |

indexes

|   |
| - |

GET /hr/dashboard

|   |
| - |

Read

|   |
| - |

P0 status derivation OPEN

|   |
| - |

Confirmed

|   |
| - |

HR-DASH-09

|   |
| - |

Dashboard TZ EST

|   |
| - |

Same as AT-DASH-10

|   |
| - |

—

|   |
| - |

dashboard

|   |
| - |

—

|   |
| - |

TZ-04

|   |
| - |

Confirmed

|   |
| - |

NOTIF-01–07

|   |
| - |

Leave submit/approve/reject(+comments); medical missing before submit; attendance/missing logout reminders

|   |
| - |

Notification service + jobs

|   |
| - |

`notifications`

|   |
| - |

in-app list; email

|   |
| - |

After TX

|   |
| - |

Channel: in-app + email **TD**

|   |
| - |

Confirmed

|   |
| - |

NOTIF-10

|   |
| - |

Teams/Slack

|   |
| - |

None

|   |
| - |

—

|   |
| - |

—

|   |
| - |

—

|   |
| - |

—

|   |
| - |

Future / Optional

|   |
| - |

NOTIF-12

|   |
| - |

Reminder schedule for late check-in/out

|   |
| - |

Job cron

|   |
| - |

—

|   |
| - |

—

|   |
| - |

Scheduler

|   |
| - |

OPEN times

|   |
| - |

Clarification Required

|   |
| - |

REP-01–13

|   |
| - |

Named reports + Excel/CSV/PDF

|   |
| - |

Report + export service

|   |
| - |

query indexes

|   |
| - |

GET /reports/{slug}

|   |
| - |

Read

|   |
| - |

guest\_admin read

|   |
| - |

Confirmed

|   |
| - |

REP-14–16

|   |
| - |

Filters, access, cancelled/withdrawn/corrected in reports

|   |
| - |

Defaults documented as TD until signed

|   |
| - |

—

|   |
| - |

query params

|   |
| - |

—

|   |
| - |

OPEN

|   |
| - |

Clarification Required

|   |
| - |

AUD-01

|   |
| - |

Every change in audit log

|   |
| - |

Audit writer in same TX

|   |
| - |

`audit_events` append-only

|   |
| - |

no employee API required

|   |
| - |

All mutations

|   |
| - |

BR-12

|   |
| - |

Confirmed

|   |
| - |

AUD-02–07

|   |
| - |

Scope of entities, actor, time, before/after

|   |
| - |

Implemented as **TD** covering leave, attendance, employee, config, documents

|   |
| - |

audit columns

|   |
| - |

optional admin GET

|   |
| - |

Mutations

|   |
| - |

Aligns Proposed

|   |
| - |

Proposed

|   |
| - |

AUD-08

|   |
| - |

Who can view audit

|   |
| - |

**OPEN** — recommend admin only

|   |
| - |

—

|   |
| - |

GET /audit

|   |
| - |

—

|   |
| - |

OPEN

|   |
| - |

Clarification Required

|   |
| - |

Config

|   |
| - |

Leave policies, holidays, weekends, hours, grace (BRD §8, §2.2)

|   |
| - |

org\_settings + holidays + leave\_types

|   |
| - |

those tables

|   |
| - |

admin PATCH

|   |
| - |

Config

|   |
| - |

BR-08, BR-15 hours

|   |
| - |

Confirmed

|   |
| - |

Data retention

|   |
| - |

MED-10 only

|   |
| - |

OPEN

|   |
| - |

—

|   |
| - |

—

|   |
| - |

—

|   |
| - |

—

|   |
| - |

Clarification Required

|   |
| - |

Security

|   |
| - |

Email/password, RBAC, medical isolation, no device clock

|   |
| - |

Supabase Auth, RLS, Storage private

|   |
| - |

—

|   |
| - |

Bearer JWT

|   |
| - |

All

|   |
| - |

AUTH-10

|   |
| - |

Confirmed

---

## **Edge cases (section 24)**

|   |
| - |

**Requirement ID**
**Scenario**
**Backend Impact**
**Status**

|   |
| - |

EDGE-01

|   |
| - |

No reporting manager

|   |
| - |

LV-WF-13: HR-direct, no manager proof

|   |
| - |

Confirmed via LV-WF-13

|   |
| - |

EDGE-02

|   |
| - |

No department

|   |
| - |

Nullable department; reports group as Unassigned

|   |
| - |

Confirmed via EMP-06

|   |
| - |

EDGE-09

|   |
| - |

Check-in then same-day leave

|   |
| - |

Leave allowed; if later approved, INT-03 correction path

|   |
| - |

Partially specified

|   |
| - |

EDGE-10

|   |
| - |

Approved leave later cancelled

|   |
| - |

LV-STS-10 correction request

|   |
| - |

Confirmed

|   |
| - |

EDGE-11

|   |
| - |

Leave spans month

|   |
| - |

Reports split by calendar month; no balances

|   |
| - |

No balance system

|   |
| - |

EDGE-12

|   |
| - |

Leave spans weekend/holiday

|   |
| - |

Day-count per BR-08/CAL-07; no sandwich fill

|   |
| - |

Confirmed calc config

|   |
| - |

EDGE-14

|   |
| - |

Leave without prior notification

|   |
| - |

LV-TYPE-07 unpaid

|   |
| - |

Confirmed unpaid; exact cutoff TD

---

## **Coverage check**

|   |
| - |

**Area from brief**
**Result**

|   |
| - |

Leave balances

|   |
| - |

Not designed — not confirmed (section 4)

|   |
| - |

Overtime

|   |
| - |

Not in requirements — out of scope, no APIs

|   |
| - |

Notifications

|   |
| - |

In-app + email for NOTIF-01–07; Teams/Slack future

|   |
| - |

Sandwich leave

|   |
| - |

CAL-07: weekends/holidays do **not** fill sandwich

|   |
| - |

Duplicate punch rules

|   |
| - |

Proposed only — technical recommendation, not policy

# **Backend architecture**

**Stack (confirmed by project, not BRD):** Node.js, Express, TypeScript, Supabase as BaaS (Auth, PostgreSQL, Storage).
Business rules for leave, overlap, medical documents, and attendance run in **Express**, not in the browser (frontend validation - so that the user can’t bypass it ), and not solely in Supabase RLS (RLS - db lev access control; complex business logic should live in express)

---

## **1. Runtime shape**

**Actual structure of the data that exists when the program is running.**

```text
Client / Web Frontend
    ↓
HTTPS
    → Securely encrypts communication between client and server
    ↓
Express API (TypeScript)
    → Receives and routes the API request
    ↓
DTO Validation (Zod)
    → Checks that the request data has the correct structure and values
    ↓
Authentication (Supabase JWT)
    → Verifies the user's identity/token
    ↓
Authorization
    → RBAC: (Role Based Access Control) checks what the user's role can do
    → Resource AuthZ: checks whether they can access this specific resource
    ↓
Domain Services
    → Applies business rules and workflows
    → (eg : Leave | Attendance | Employees | Reports | Notifications | Audit)
    ↓
Repositories
    → Handles database/storage- keeps business logic separate from database-access logic.
    ↓
Supabase PostgreSQL (PostgreSQL database hosted by Supabase)
    → Stores application data
    → Uses the user's JWT/RLS or service role where appropriate after server-side authorization
    ↓
Supabase Storage
    → Stores private files/documents (medical doc, etc)
    → Authorized users receive signed download URLs
    ↓
Supabase Auth
    → Handles email/password authentication and user sessions
```

**Why Express in front of Supabase:** overlap, medical gates, leave day-count, approve + attendance write-back, and correction side-effects need transactions and cannot be trusted to client-side Supabase calls.
**RLS:**  database-level security feature in PostgreSQL/Supabase that controls which rows a user is allowed to read or modify.

---

## **2. Module boundaries**

**Defines which part of the backend is responsible for which functionality**

|   |
| - |

Module
Responsibility — in simple terms

|   |
| - |

`auth`

|   |
| - |

Handles login, logout, sessions, password recovery, and checking the current user.

|   |
| - |

`employees`

|   |
| - |

Manages employee profiles, managers, departments, activation/deactivation, and user provisioning.

|   |
| - |

`leave`

|   |
| - |

Handles the entire leave workflow — leave types, applications, day calculation, overlap, medical requirements, approval, cancellation/withdrawal.

|   |
| - |

`attendance`

|   |
| - |

Handles check-in/out, attendance status, corrections, and admin edits.

|   |
| - |

`calendar`

|   |
| - |

Defines holidays, weekly offs, working hours, and grace periods.

|   |
| - |

`documents`

|   |
| - |

Handles document uploads, metadata, storage access, and authorization for medical documents.

|   |
| - |

`notifications`

|   |
| - |

Handles in-app notifications, emails, and reminder jobs.

|   |
| - |

`reports`

|   |
| - |

Generates aggregated reports and exports them as Excel/CSV/PDF.

|   |
| - |

`audit`

|   |
| - |

Records important actions performed in the system in an append-only audit log.

|   |
| - |

`config`

|   |
| - |

Stores organization-level settings such as `org_settings`.
No overtime, payroll, or leave-balance modules (**confirmed**).

---

## **3. API standards**

|   |
| - |

**Topic**
**Convention / Definition**

|   |
| - |

Base URL

|   |
| - |

All API endpoints use `/api/v1` as the versioned base path.

|   |
| - |

Resources

|   |
| - |

Use plural nouns, e.g. `/leaves`, `/employees`, `/attendance/corrections`.

|   |
| - |

HTTP Methods

|   |
| - |

GET = read, POST = create/actions, PATCH = partial update, DELETE = only unused leave types.

|   |
| - |

Authentication Header

|   |
| - |

`Authorization: Bearer <supabase_access_token>`

|   |
| - |

IDs

|   |
| - |

Use UUID strings for resource identifiers.

|   |
| - |

Date

|   |
| - |

`YYYY-MM-DD`, interpreted in the organization's timezone.

|   |
| - |

Date-time

|   |
| - |

ISO-8601 UTC format ending in `Z`. date and time are written in a standard format and always represented in UTC. 
 (2026-08-25T12:30:00Z) - `T` → separates date and time and `Z` → UTC timezone

|   |
| - |

Pagination

|   |
| - |

`page`, `pageSize`; default 20, maximum 100 (**requires confirmation**). Response includes `meta: { page, pageSize, total }`. 

|   |
| - |

Filtering / Sorting

|   |
| - |

Use query parameters (values added to the URL to filter/sort data); each endpoint has a predefined list of allowed fields for sorting (date, status, etc)

|   |
| - |

Idempotency

|   |
| - |

(Ensures that sending the same request multiple times doesn't create multiple results.)
Use `Idempotency-Key` (to ensure the server can recognize the same req) for duplicate-sensitive POST requests such as leave, check-in/out, and attendance corrections.

|   |
| - |

Optimistic Concurrency

|   |
| - |

Prevents one user's update from overwriting another user's recent update. - **requires confirmation**
Use `If-Match: <rowVersion>` or `rowVersion` to detect conflicting updates.

|   |
| - |

Error Response

|   |
| - |

`{ "error": { "code": "...", "message": "...", "details": {} } }` for consistent error handling.

### **HTTP status codes**

|   |
| - |

**Code**
**Use**

|   |
| - |

200

|   |
| - |

GET/PATCH success

|   |
| - |

201

|   |
| - |

POST create

|   |
| - |

204

|   |
| - |

Logout / delete type with no body

|   |
| - |

400

|   |
| - |

Malformed JSON

|   |
| - |

401

|   |
| - |

Missing/invalid token

|   |
| - |

403

|   |
| - |

Authenticated, not permitted (guest\_admin mutating; medical GET by employee)

|   |
| - |

404

|   |
| - |

Unknown id (after authz)

|   |
| - |

409

|   |
| - |

Overlap, invalid transition, duplicate punch (if TD enabled), version conflict

|   |
| - |

422

|   |
| - |

Field/business validation

|   |
| - |

429

|   |
| - |

Rate limit (login, check-in)

---

## **4. Date and timezone (critical)**

|   |
| - |

**Clock**
**Rule / Definition**

|   |
| - |

Storage of instants

|   |
| - |

Use `timestamptz` and store timestamps in UTC.

|   |
| - |

Storage of leave/holiday/work dates

|   |
| - |

Use `date` for civil calendar dates, without a time component. (Stores only the calendar date (e.g. `2026-08-25`), without a time or timezone.)

|   |
| - |

Authoritative punch time

|   |
| - |

Use the server clock (NTP - server) for check-in/out. Device time is not trusted. 

|   |
| - |

Org / reports / dashboards / notifications

|   |
| - |

Use US Eastern Time — IANA `America/New_York`. “EST” includes EDT (Eastern Daylight Time) when applicable.

|   |
| - |

Employee timezone

|   |
| - |

No per-employee timezone in v1; the organization uses a common timezone.

|   |
| - |

Half-day bounds

|   |
| - |

First half: first 4 hours after `work_start`. Second half: remaining scheduled hours.

|   |
| - |

Overnight 18:30–02:30

|   |
| - |

`work_date` is set to the Eastern calendar date of check-in. Shift duration is calculated from check-in to check-out, even when the shift crosses midnight. Full-shift master data is OPEN (not yet finalized)

|   |
| - |

Leave day-count

|   |
| - |

Count inclusive civil dates (Count both the start date and end date.), then exclude weekends/holidays defined in `org_settings`. No sandwich leave.
Do not mix JS `Date` local TZ with civil leave dates. Convert with `America/New_York` explicitly.

---

## **5. Supabase usage** 

|   |
| - |

**Product**
**Use / Definition**

|   |
| - |

Auth

|   |
| - |

Email + password authentication (AUTH-10); Supabase issues a JWT used by Express. Session expiry is configured in Supabase; TTL (Time To Live - how long a sess/ token is valid ) is TBD (default access/refresh settings apply - **requires confirmation**).

|   |
| - |

PostgreSQL

|   |
| - |

Stores all application data in tables within the `public` schema.

|   |
| - |

Storage

|   |
| - |

Uses a private bucket, `leave-documents`. Files are uploaded through Express using the service role and downloaded only after authorization.

|   |
| - |

Edge Functions

|   |
| - |

Not required for v1. Reminder jobs can use Express cron (for running scheduled jobs at a fixed time - **requires confirmation**)  initially or `pg_cron` later.
Password reset: Supabase recovery email. Account provisioning: `admin` creates employee → Auth invite or temporary password (**TD**, AUTH-10 requires a defined method).

---

## **6. Migration strategy** 

**How database changes are created, tracked, applied, and managed safely across environments.**

|   |
| - |

**Topic**
**Approach / Definition**

|   |
| - |

Tool

|   |
| - |

Use Supabase CLI migrations to manage and apply database changes. Migration files are stored in `supabase/migrations`. Optional initial/seed data can be added through Express.

|   |
| - |

Naming

|   |
| - |

Each migration gets a timestamped filename, so migrations can be identified and ordered. Use `YYYYMMDDHHMMSS_description.sql` following the CLI naming convention.

|   |
| - |

Order

|   |
| - |

Migrations run chronologically. Once a migration is applied, do not edit it; create a new migration for any changes.

|   |
| - |

Seeds

|   |
| - |

Add required initial data, such as standard leave types and one `org_settings` record. The first `admin` user is created separately (out-of-band).

|   |
| - |

Rollback

|   |
| - |

Instead of undoing a production migration, create a new migration that fixes the problem. Avoid destructive rollback scripts in production.

|   |
| - |

Environments

|   |
| - |

Keep Local, Staging, and Production as separate Supabase projects. Service-role keys must never be shared between environments.
Do not implement migrations in this phase.

---

## **7. Jobs (notifications) \***

|   |
| - |

**Job**
**Purpose**
**Schedule**

|   |
| - |

Unmarked attendance reminder

|   |
| - |

NOTIF-06

|   |
| - |

**OPEN** (NOTIF-12) — job exists, cron TBD

|   |
| - |

Missing logout reminder

|   |
| - |

NOTIF-07

|   |
| - |

**OPEN** (NOTIF-12)

|   |
| - |

Email drain

|   |
| - |

Send persisted notification rows

|   |
| - |

Near-real-time
Teams/Slack: out of scope (NOTIF-10 Future).

# **Database schema (PostgreSQL / Supabase)**

Source of truth for tables. The ER diagram in [**er-diagram.md**](https://markdowntoword.io/er-diagram.md) must match this file.
**Conventions:** `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`; instants `timestamptz`; civil dates `date`; `created_at` / `updated_at timestamptz`; mutable rows `row_version int not null default 1`; statuses `text` + `CHECK` (easier to extend than PG enums).
**Not created:** leave\_balances, overtime, teams, permission tables, multi-tenant `org_id`.
**IDs:** UUID (Supabase/Auth alignment). **JSON:** only `audit_events.before_json` / `after_json`.

---

## `org_settings` **(single row)**

Purpose: working hours, weekly offs, leave-count flags, medical optional policy, timezone.

|   |
| - |

**Column**
**Type**
**Null**
**Default**
**Notes**

|   |
| - |

id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

gen\_random\_uuid()

|   |
| - |

PK

|   |
| - |

timezone

|   |
| - |

text

|   |
| - |

no

|   |
| - |

`'America/New_York'`

|   |
| - |

Reports/dashboards (AT-DASH-10, TZ-04)

|   |
| - |

work\_start

|   |
| - |

time

|   |
| - |

no

|   |
| - |

—

|   |
| - |

Seed from ops, not invented

|   |
| - |

work\_end

|   |
| - |

time

|   |
| - |

no

|   |
| - |

—

|   |
| - |

May be before start (overnight); technical decision

|   |
| - |

grace\_minutes

|   |
| - |

int

|   |
| - |

no

|   |
| - |

—

|   |
| - |

Late login; `>= 0`

|   |
| - |

weekly\_off\_dow

|   |
| - |

int[]

|   |
| - |

no

|   |
| - |

—

|   |
| - |

ISO 1–7 (CAL-02)

|   |
| - |

leave\_count\_excludes\_weekends

|   |
| - |

boolean

|   |
| - |

no

|   |
| - |

—

|   |
| - |

BR-08

|   |
| - |

leave\_count\_excludes\_holidays

|   |
| - |

boolean

|   |
| - |

no

|   |
| - |

—

|   |
| - |

BR-08

|   |
| - |

medical\_doc\_optional\_1\_to\_2\_days

|   |
| - |

boolean

|   |
| - |

no

|   |
| - |

true

|   |
| - |

BR-05 company policy

|   |
| - |

medical\_doc\_exceeds\_days

|   |
| - |

numeric(6,2)

|   |
| - |

no

|   |
| - |

2

|   |
| - |

BR-03; MED-12 uses calculated\_days

|   |
| - |

max\_advance\_days

|   |
| - |

int

|   |
| - |

no

|   |
| - |

4

|   |
| - |

LV-DATE-06 half-week **TD** (calendar days)

|   |
| - |

updated\_at

|   |
| - |

timestamptz

|   |
| - |

no

|   |
| - |

now()

|   |
| - |

|   |
| - |

row\_version

|   |
| - |

int

|   |
| - |

no

|   |
| - |

1

|   |
| - |

CHECK: `grace_minutes >= 0`; `max_advance_days > 0`; `medical_doc_exceeds_days > 0`.

---

## `users`

Purpose: application role linked 1:1 to `auth.users`.

|   |
| - |

**Column**
**Type**
**Null**
**Default**
**Notes**

|   |
| - |

id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

—

|   |
| - |

PK; **same as** `auth.users.id`

|   |
| - |

email

|   |
| - |

citext

|   |
| - |

no

|   |
| - |

—

|   |
| - |

UNIQUE

|   |
| - |

role

|   |
| - |

text

|   |
| - |

no

|   |
| - |

—

|   |
| - |

CHECK `IN ('employee','admin','guest_admin')` AUTH-09

|   |
| - |

is\_active

|   |
| - |

boolean

|   |
| - |

no

|   |
| - |

true

|   |
| - |

|   |
| - |

created\_at

|   |
| - |

timestamptz

|   |
| - |

no

|   |
| - |

now()

|   |
| - |

|   |
| - |

updated\_at

|   |
| - |

timestamptz

|   |
| - |

no

|   |
| - |

now()

|   |
| - |

FK: none to public; identity is Auth UUID. Deactivate: `is_active = false` (soft). Do not delete Auth user in v1 (**TD**).
Index: `(role)`, `(email)`.

---

## `employees`

Purpose: HR profile (EMP-01). Allowed with no department and no manager (EMP-06).

|   |
| - |

**Column**
**Type**
**Null**
**Default**
**Notes**

|   |
| - |

id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

gen\_random\_uuid()

|   |
| - |

PK

|   |
| - |

user\_id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

—

|   |
| - |

UNIQUE REFERENCES users(id)

|   |
| - |

full\_name

|   |
| - |

text

|   |
| - |

no

|   |
| - |

—

|   |
| - |

EMP-02

|   |
| - |

department

|   |
| - |

text

|   |
| - |

yes

|   |
| - |

—

|   |
| - |

EMP-03; not a Team table

|   |
| - |

sex

|   |
| - |

text

|   |
| - |

yes

|   |
| - |

—

|   |
| - |

CHECK `IN ('male','female','unspecified')`; LV-TYPE-06

|   |
| - |

reporting\_manager\_employee\_id

|   |
| - |

uuid

|   |
| - |

yes

|   |
| - |

—

|   |
| - |

FK employees(id) ON DELETE SET NULL

|   |
| - |

deactivated\_at

|   |
| - |

timestamptz

|   |
| - |

yes

|   |
| - |

—

|   |
| - |

Soft delete

|   |
| - |

created\_at / updated\_at / row\_version

|   |
| - |

|   |
| - |

no

|   |
| - |

|   |
| - |

Indexes: `(department)`, `(reporting_manager_employee_id)`, `(user_id)`.

---

## `leave_types`

Purpose: configurable types (LV-TYPE-01–07).

|   |
| - |

**Column**
**Type**
**Null**
**Default**
**Notes**

|   |
| - |

id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

gen\_random\_uuid()

|   |
| - |

PK

|   |
| - |

code

|   |
| - |

text

|   |
| - |

no

|   |
| - |

—

|   |
| - |

UNIQUE

|   |
| - |

name

|   |
| - |

text

|   |
| - |

no

|   |
| - |

—

|   |
| - |

|   |
| - |

is\_active

|   |
| - |

boolean

|   |
| - |

no

|   |
| - |

true

|   |
| - |

Deactivate vs delete

|   |
| - |

is\_paid

|   |
| - |

boolean

|   |
| - |

no

|   |
| - |

true

|   |
| - |

LV-TYPE-07

|   |
| - |

is\_medical

|   |
| - |

boolean

|   |
| - |

no

|   |
| - |

false

|   |
| - |

Sick seeded true **after** treating Sick = medical (BRD §5 “medical leave”)

|   |
| - |

allowed\_sex

|   |
| - |

text

|   |
| - |

yes

|   |
| - |

—

|   |
| - |

NULL = all; `'female'` for Maternity (LV-TYPE-06)

|   |
| - |

requires\_prior\_notice

|   |
| - |

boolean

|   |
| - |

no

|   |
| - |

false

|   |
| - |

If true, unpaid path when start ≤ today

|   |
| - |

max\_advance\_days

|   |
| - |

int

|   |
| - |

yes

|   |
| - |

—

|   |
| - |

NULL = use org\_settings (LV-DATE-07)

|   |
| - |

created\_at / updated\_at

|   |
| - |

|   |
| - |

no

|   |
| - |

|   |
| - |

Seed: CASUAL, SICK (`is_medical true`), EMERGENCY, PLANNED. Unpaid/Maternity/Paternity/Comp-off **not** required as seed; admin may create (LV-TYPE-05).
DELETE: only if no `leave_applications` reference (ON DELETE RESTRICT). Otherwise PATCH `is_active = false`.

---

## `public_holidays`

|   |
| - |

**Column**
**Type**
**Null**
**Notes**

|   |
| - |

id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

PK

|   |
| - |

holiday\_date

|   |
| - |

date

|   |
| - |

no

|   |
| - |

UNIQUE

|   |
| - |

name

|   |
| - |

text

|   |
| - |

no

|   |
| - |

CAL-01, CAL-03.

---

## `leave_applications`

Purpose: one application (possibly multi-day).

|   |
| - |

**Column**
**Type**
**Null**
**Notes**

|   |
| - |

id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

PK

|   |
| - |

employee\_id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

FK employees ON DELETE RESTRICT

|   |
| - |

leave\_type\_id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

FK leave\_types ON DELETE RESTRICT

|   |
| - |

start\_date

|   |
| - |

date

|   |
| - |

no

|   |
| - |

|   |
| - |

end\_date

|   |
| - |

date

|   |
| - |

no

|   |
| - |

|   |
| - |

duration\_mode

|   |
| - |

text

|   |
| - |

no

|   |
| - |

HALF\_DAY / FULL\_DAY / MULTIPLE\_DAYS

|   |
| - |

half\_session

|   |
| - |

text

|   |
| - |

yes

|   |
| - |

FIRST / SECOND

|   |
| - |

calculated\_days

|   |
| - |

numeric(6,2)

|   |
| - |

no

|   |
| - |

Auto; CHECK `> 0`

|   |
| - |

is\_paid

|   |
| - |

boolean

|   |
| - |

no

|   |
| - |

Snapshot after LV-TYPE-07 rule

|   |
| - |

reason

|   |
| - |

text

|   |
| - |

no

|   |
| - |

CHECK length trim > 0

|   |
| - |

status

|   |
| - |

text

|   |
| - |

no

|   |
| - |

See state machine

|   |
| - |

reporting\_manager\_employee\_id

|   |
| - |

uuid

|   |
| - |

yes

|   |
| - |

Snapshot

|   |
| - |

manager\_approval\_attested

|   |
| - |

boolean

|   |
| - |

no

|   |
| - |

default false; LV-WF-09

|   |
| - |

clarification\_comment

|   |
| - |

text

|   |
| - |

yes

|   |
| - |

LV-WF-07

|   |
| - |

hr\_comments

|   |
| - |

text

|   |
| - |

yes

|   |
| - |

Reject

|   |
| - |

submitted\_at

|   |
| - |

timestamptz

|   |
| - |

yes

|   |
| - |

|   |
| - |

reviewed\_at

|   |
| - |

timestamptz

|   |
| - |

yes

|   |
| - |

|   |
| - |

reviewed\_by\_user\_id

|   |
| - |

uuid

|   |
| - |

yes

|   |
| - |

FK users

|   |
| - |

cancelled\_or\_withdrawn\_at

|   |
| - |

timestamptz

|   |
| - |

yes

|   |
| - |

|   |
| - |

row\_version

|   |
| - |

int

|   |
| - |

no

|   |
| - |

|   |
| - |

created\_at / updated\_at

|   |
| - |

timestamptz

|   |
| - |

no

|   |
| - |

CHECKs:

- `start_date <= end_date`
- Half-day: `half_session IS NOT NULL AND start_date = end_date`
- Non-half: `half_session IS NULL`
- Full-day: `start_date = end_date`
- `status IN ('DRAFT','SUBMITTED','PENDING_HR_REVIEW','APPROVED','REJECTED','CANCELLED','WITHDRAWN')`
- `duration_mode IN ('HALF_DAY','FULL_DAY','MULTIPLE_DAYS')`

Indexes: `(employee_id, start_date, end_date)`, `(status)`, `(submitted_at DESC)`, `(leave_type_id)`.
**Overlap:** application-level in submit TX. GiST exclusion **after** LV-OVR-03/04 values are chosen (see decisions).

---

## `leave_status_history`

Append-only.

|   |
| - |

**Column**
**Type**
**Null**

|   |
| - |

id

|   |
| - |

uuid

|   |
| - |

no PK

|   |
| - |

leave\_application\_id

|   |
| - |

uuid

|   |
| - |

no FK

|   |
| - |

from\_status

|   |
| - |

text

|   |
| - |

yes

|   |
| - |

to\_status

|   |
| - |

text

|   |
| - |

no

|   |
| - |

actor\_user\_id

|   |
| - |

uuid

|   |
| - |

yes FK users

|   |
| - |

comment

|   |
| - |

text

|   |
| - |

yes

|   |
| - |

occurred\_at

|   |
| - |

timestamptz

|   |
| - |

no default now()
Index: `(leave_application_id, occurred_at)`.

---

## `documents`

Metadata; bytes in Supabase Storage.

|   |
| - |

**Column**
**Type**
**Null**
**Notes**

|   |
| - |

id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

PK

|   |
| - |

leave\_application\_id

|   |
| - |

uuid

|   |
| - |

yes

|   |
| - |

FK

|   |
| - |

correction\_id

|   |
| - |

uuid

|   |
| - |

yes

|   |
| - |

FK

|   |
| - |

kind

|   |
| - |

text

|   |
| - |

no

|   |
| - |

`MEDICAL` / `MANAGER_PROOF` / `CORRECTION` / `SUPPORTING`

|   |
| - |

storage\_bucket

|   |
| - |

text

|   |
| - |

no

|   |
| - |

|   |
| - |

storage\_key

|   |
| - |

text

|   |
| - |

no

|   |
| - |

UNIQUE

|   |
| - |

original\_filename

|   |
| - |

text

|   |
| - |

no

|   |
| - |

|   |
| - |

content\_type

|   |
| - |

text

|   |
| - |

no

|   |
| - |

pdf/jpeg/png

|   |
| - |

byte\_size

|   |
| - |

int

|   |
| - |

no

|   |
| - |

`> 0`

|   |
| - |

uploaded\_by\_user\_id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

FK users

|   |
| - |

created\_at

|   |
| - |

timestamptz

|   |
| - |

no

|   |
| - |

CHECK: at most one of leave/correction set after attach. Unattached allowed until submit (**TD**).
Medical rows: GET only `admin` / `guest_admin` (MED-09).

---

## `attendance_days`

One row per employee per `work_date` (Eastern civil date of check-in). **AT-06 Proposed** — unique constraint is a **technical integrity** choice, not a signed duplicate-punch policy.

|   |
| - |

**Column**
**Type**
**Null**
**Notes**

|   |
| - |

id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

PK

|   |
| - |

employee\_id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

FK

|   |
| - |

work\_date

|   |
| - |

date

|   |
| - |

no

|   |
| - |

UNIQUE with employee\_id

|   |
| - |

check\_in\_at

|   |
| - |

timestamptz

|   |
| - |

yes

|   |
| - |

Server time

|   |
| - |

check\_out\_at

|   |
| - |

timestamptz

|   |
| - |

yes

|   |
| - |

|   |
| - |

leave\_application\_id

|   |
| - |

uuid

|   |
| - |

yes

|   |
| - |

FK; INT-01

|   |
| - |

derived\_status

|   |
| - |

text

|   |
| - |

yes

|   |
| - |

Present, Absent, On Leave, Half-Day, Holiday, Weekly Off, Missing Check-In, Missing Check-Out

|   |
| - |

is\_late

|   |
| - |

boolean

|   |
| - |

yes

|   |
| - |

After work\_start + grace

|   |
| - |

admin\_modified

|   |
| - |

boolean

|   |
| - |

no

|   |
| - |

default false; AT-COR-11

|   |
| - |

row\_version

|   |
| - |

int

|   |
| - |

no

|   |
| - |

|   |
| - |

created\_at / updated\_at

|   |
| - |

|   |
| - |

no

|   |
| - |

CHECK derived\_status IN the eight BRD labels when not null.
Indexes: `(work_date)`, `(derived_status)`, `(leave_application_id)`, UNIQUE `(employee_id, work_date)`.
Employee updates of punch columns forbidden except via correction-approve or admin patch (AT-COR-10, AT-COR-11).
**Status derivation:** labels Confirmed; exact qualification still “requires clarification” in requirements §14. Store punches + leave FK always; fill `derived_status` with conservative rules in [**business-rules.md**](https://markdowntoword.io/business-rules.md) and keep remaining ambiguity OPEN.

---

## `attendance_corrections`

|   |
| - |

**Column**
**Type**
**Null**
**Notes**

|   |
| - |

id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

PK

|   |
| - |

employee\_id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

FK

|   |
| - |

attendance\_day\_id

|   |
| - |

uuid

|   |
| - |

yes

|   |
| - |

FK

|   |
| - |

work\_date

|   |
| - |

date

|   |
| - |

no

|   |
| - |

|   |
| - |

correction\_type

|   |
| - |

text

|   |
| - |

no

|   |
| - |

Values **OPEN** (AT-COR-03 named, enum not listed)

|   |
| - |

proposed\_check\_in\_at

|   |
| - |

timestamptz

|   |
| - |

yes

|   |
| - |

|   |
| - |

proposed\_check\_out\_at

|   |
| - |

timestamptz

|   |
| - |

yes

|   |
| - |

|   |
| - |

reason

|   |
| - |

text

|   |
| - |

no

|   |
| - |

|   |
| - |

status

|   |
| - |

text

|   |
| - |

no

|   |
| - |

SUBMITTED / APPROVED / REJECTED **TD** (review confirmed; outcomes needed)

|   |
| - |

source

|   |
| - |

text

|   |
| - |

no

|   |
| - |

`EMPLOYEE` / `SYSTEM_INT03` / `SYSTEM_STS10`

|   |
| - |

hr\_comments

|   |
| - |

text

|   |
| - |

yes

|   |
| - |

|   |
| - |

reviewed\_by\_user\_id

|   |
| - |

uuid

|   |
| - |

yes

|   |
| - |

|   |
| - |

reviewed\_at

|   |
| - |

timestamptz

|   |
| - |

yes

|   |
| - |

|   |
| - |

row\_version / created\_at / updated\_at

|   |
| - |

|   |
| - |

|   |
| - |

Index: `(employee_id, work_date)`, `(status)`.
Partial unique **TD:** one `SUBMITTED` per `(employee_id, work_date)`.

---

## `correction_status_history`

Same pattern as leave history, FK `correction_id`.

---

## `notifications`

|   |
| - |

**Column**
**Type**
**Null**
**Notes**

|   |
| - |

id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

PK

|   |
| - |

recipient\_user\_id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

FK

|   |
| - |

event\_type

|   |
| - |

text

|   |
| - |

no

|   |
| - |

|   |
| - |

channel

|   |
| - |

text

|   |
| - |

no

|   |
| - |

`IN_APP` / `EMAIL`

|   |
| - |

payload

|   |
| - |

jsonb

|   |
| - |

no

|   |
| - |

Non-medical summary

|   |
| - |

read\_at

|   |
| - |

timestamptz

|   |
| - |

yes

|   |
| - |

|   |
| - |

sent\_at

|   |
| - |

timestamptz

|   |
| - |

yes

|   |
| - |

|   |
| - |

created\_at

|   |
| - |

timestamptz

|   |
| - |

no

|   |
| - |

Index: `(recipient_user_id, created_at DESC)`.

---

## `audit_events`

Append-only (AUD-01 / BR-12). No UPDATE/DELETE.

|   |
| - |

**Column**
**Type**
**Null**

|   |
| - |

id

|   |
| - |

uuid

|   |
| - |

no PK

|   |
| - |

occurred\_at

|   |
| - |

timestamptz

|   |
| - |

no default now()

|   |
| - |

actor\_user\_id

|   |
| - |

uuid

|   |
| - |

yes

|   |
| - |

action

|   |
| - |

text

|   |
| - |

no

|   |
| - |

entity\_type

|   |
| - |

text

|   |
| - |

no

|   |
| - |

entity\_id

|   |
| - |

uuid

|   |
| - |

yes

|   |
| - |

before\_json

|   |
| - |

jsonb

|   |
| - |

yes

|   |
| - |

after\_json

|   |
| - |

jsonb

|   |
| - |

yes

|   |
| - |

request\_id

|   |
| - |

uuid

|   |
| - |

yes

|   |
| - |

ip

|   |
| - |

inet

|   |
| - |

yes
Indexes: `(entity_type, entity_id, occurred_at DESC)`, `(actor_user_id, occurred_at DESC)`.

---

## `idempotency_keys`

|   |
| - |

**Column**
**Type**
**Null**

|   |
| - |

user\_id

|   |
| - |

uuid

|   |
| - |

no

|   |
| - |

key

|   |
| - |

text

|   |
| - |

no

|   |
| - |

request\_hash

|   |
| - |

text

|   |
| - |

no

|   |
| - |

response\_status

|   |
| - |

int

|   |
| - |

no

|   |
| - |

response\_body

|   |
| - |

jsonb

|   |
| - |

no

|   |
| - |

created\_at / expires\_at

|   |
| - |

timestamptz

|   |
| - |

no
PK `(user_id, key)`.

---

## **Foreign-key behavior**

|   |
| - |

**FK**
**On delete**

|   |
| - |

employees.user\_id

|   |
| - |

RESTRICT

|   |
| - |

employees.reporting\_manager

|   |
| - |

SET NULL

|   |
| - |

leave\_applications.employee / type

|   |
| - |

RESTRICT

|   |
| - |

attendance\_days.leave\_application

|   |
| - |

SET NULL

|   |
| - |

documents parents

|   |
| - |

SET NULL or RESTRICT if attached

---

## **Indexing (access patterns)**

|   |
| - |

**Table**
**Columns**
**Use case**

|   |
| - |

employees

|   |
| - |

department

|   |
| - |

Department reports (REP-02)

|   |
| - |

leave\_applications

|   |
| - |

employee\_id, start\_date, end\_date

|   |
| - |

Overlap, employee history

|   |
| - |

leave\_applications

|   |
| - |

status

|   |
| - |

HR pending queue, HR-DASH-08

|   |
| - |

leave\_applications

|   |
| - |

submitted\_at DESC

|   |
| - |

Inbox sort

|   |
| - |

attendance\_days

|   |
| - |

(employee\_id, work\_date) UNIQUE

|   |
| - |

Punch + “today”

|   |
| - |

attendance\_days

|   |
| - |

work\_date

|   |
| - |

Daily HR dashboard / REP-06

|   |
| - |

attendance\_days

|   |
| - |

derived\_status

|   |
| - |

Present/absent/leave counts

|   |
| - |

attendance\_corrections

|   |
| - |

status

|   |
| - |

HR review queue

|   |
| - |

audit\_events

|   |
| - |

entity\_type, entity\_id, occurred\_at

|   |
| - |

Traceability

|   |
| - |

notifications

|   |
| - |

recipient, created\_at

|   |
| - |

In-app list

|   |
| - |

public\_holidays

|   |
| - |

holiday\_date

|   |
| - |

Day-count

|   |
| - |

leave\_types

|   |
| - |

is\_active

|   |
| - |

Apply dropdown
Do not index every column.

---

## **Concurrency helpers**

- `row_version` on leave\_applications, attendance\_days, attendance\_corrections, org\_settings, employees.
- Unique `(employee_id, work_date)` serializes punches.
- Leave submit: `SELECT employees WHERE id = $1 FOR UPDATE` then overlap SELECT.

# **ER diagram**

Must match [**database-schema.md**](http://database-schema.md). Optional relationships: dashed via nullable FKs.

```
erDiagram
  authUsers["auth.users (Supabase)"] ||--|| users : "id equals"
  users ||--|| employees : "user_id"
  employees }o--o| employees : "reporting_manager"
  users ||--o{ leave_applications : "reviewed_by"
  employees ||--o{ leave_applications : "submits"
  leave_types ||--o{ leave_applications : "type"
  leave_applications ||--o{ leave_status_history : "history"
  leave_applications ||--o{ documents : "files"
  employees ||--o{ attendance_days : "daily"
  leave_applications ||--o{ attendance_days : "on_leave_link"
  employees ||--o{ attendance_corrections : "requests"
  attendance_days ||--o{ attendance_corrections : "optional_day"
  attendance_corrections ||--o{ documents : "files"
  attendance_corrections ||--o{ correction_status_history : "history"
  users ||--o{ notifications : "recipient"
  users ||--o{ audit_events : "actor"
  users ||--o{ idempotency_keys : "owner"
```

**Also (no FK to employees):** `org_settings` (1 row), `public_holidays`.

|   |
| - |

**Relationship**
**Cardinality**
**Mandatory**

|   |
| - |

users ↔ employees

|   |
| - |

1:1

|   |
| - |

Yes for workers who punch/apply; guest\_admin may have employee row or not **TD**: guest\_admin without employee cannot punch

|   |
| - |

employee → manager

|   |
| - |

N:1

|   |
| - |

Optional (EMP-06)

|   |
| - |

employee → leave\_applications

|   |
| - |

1\:N

|   |
| - |

|   |
| - |

leave\_type → applications

|   |
| - |

1\:N

|   |
| - |

Type required

|   |
| - |

leave → documents

|   |
| - |

1\:N

|   |
| - |

Optional until medical rule

|   |
| - |

employee → attendance\_days

|   |
| - |

1\:N

|   |
| - |

Unique per date

|   |
| - |

leave → attendance\_days

|   |
| - |

1\:N

|   |
| - |

Set on approve (INT-01)

|   |
| - |

employee → corrections

|   |
| - |

1\:N

|   |
| - |

|   |
| - |

correction → documents

|   |
| - |

1\:N

|   |
| - |

Optional
No many-to-many junction tables in v1.

# **Domain entities vs database vs API DTOs**

Database tables are defined in [**database-schema.md**](http://database-schema.md). APIs must not dump table rows (password hashes live only in Supabase Auth; storage keys are not returned to employees for medical files).

---

## **Mapping**

|   |
| - |

**Domain object**
**DB table**
**Typical API DTO**
**Notes**

|   |
| - |

UserAccount

|   |
| - |

users + auth.users

|   |
| - |

`UserDto` (id, email, role)

|   |
| - |

No password field

|   |
| - |

Employee

|   |
| - |

employees

|   |
| - |

`EmployeeDto` / `EmployeeAdminDto`

|   |
| - |

sex visible to admin; not on leave public lists

|   |
| - |

OrgSettings

|   |
| - |

org\_settings

|   |
| - |

`OrgSettingsDto`

|   |
| - |

|   |
| - |

LeaveType

|   |
| - |

leave\_types

|   |
| - |

`LeaveTypeDto`

|   |
| - |

Hide internal flags from employees except name/id

|   |
| - |

Holiday

|   |
| - |

public\_holidays

|   |
| - |

`HolidayDto`

|   |
| - |

|   |
| - |

LeaveApplication

|   |
| - |

leave\_applications

|   |
| - |

`LeaveSummaryDto`, `LeaveDetailDto`

|   |
| - |

Auto name/dept/manager on detail

|   |
| - |

LeaveStatusHistory

|   |
| - |

leave\_status\_history

|   |
| - |

nested on detail

|   |
| - |

|   |
| - |

DocumentRef

|   |
| - |

documents

|   |
| - |

`DocumentMetaDto`

|   |
| - |

Medical: metadata to admin/guest\_admin only

|   |
| - |

AttendanceDay

|   |
| - |

attendance\_days

|   |
| - |

`AttendanceDayDto`

|   |
| - |

|   |
| - |

AttendanceCorrection

|   |
| - |

attendance\_corrections

|   |
| - |

`CorrectionDto`

|   |
| - |

|   |
| - |

Notification

|   |
| - |

notifications

|   |
| - |

`NotificationDto`

|   |
| - |

|   |
| - |

AuditEvent

|   |
| - |

audit\_events

|   |
| - |

`AuditEventDto`

|   |
| - |

Admin only if AUD-08 so decided

---

## **Domain invariants (confirmed)**

|   |
| - |

**Entity**
**Invariants**

|   |
| - |

LeaveApplication

|   |
| - |

Dates required; reason required; overlap forbidden among **blocking** statuses (set TBD LV-OVR-03/04); medical if `is_medical` and calculated\_days > threshold; manager attestation unless no manager

|   |
| - |

LeaveType

|   |
| - |

Unique code; maternity `allowed_sex = female`

|   |
| - |

AttendanceDay

|   |
| - |

Employee cannot set check\_in/out except through punch APIs or applied correction; admin may PATCH (AT-COR-11)

|   |
| - |

Document

|   |
| - |

content\_type allowlist; medical GET not for `employee` (MED-09)

|   |
| - |

UserAccount

|   |
| - |

role ∈ {employee, admin, guest\_admin}

---

## **Entities considered and not created**

|   |
| - |

**Candidate**
**Decision**
**Reason**

|   |
| - |

LeaveBalance / LeavePolicy entitlement

|   |
| - |

Omit

|   |
| - |

Section 4: balances not defined

|   |
| - |

LeaveApplicationDay

|   |
| - |

Omit

|   |
| - |

Day-count derived; half-day stored on header

|   |
| - |

Approval entity

|   |
| - |

Omit

|   |
| - |

HR actions are status transitions + history

|   |
| - |

AttendanceEvent (multiple punches)

|   |
| - |

Omit

|   |
| - |

Daily check-in/out; one row per date

|   |
| - |

Role / Permission tables

|   |
| - |

Omit

|   |
| - |

Three roles sufficient (AUTH-09)

|   |
| - |

Department table

|   |
| - |

Omit

|   |
| - |

`employees.department` text (EMP-03)

|   |
| - |

Overtime

|   |
| - |

Omit

|   |
| - |

Not in requirements

|   |
| - |

Notification outbox separate

|   |
| - |

Optional later

|   |
| - |

`notifications.sent_at` enough for v1
`is_medical` on leave type is a **technical** mapping so BRD “medical leave” can attach to Sick (or any type HR marks medical) without a second “Medical Leave” name unless HR creates one.

# **Business rules (backend enforcement)**

Only **Confirmed** / **Confirm** rules are mandatory. Proposed rules are listed and **must not** be treated as policy until signed.

|   |
| - |

**Rule ID**
**Business Rule**
**Where Enforced**
**Failure Response**

|   |
| - |

BR-01

|   |
| - |

Leave cannot be submitted without required dates

|   |
| - |

API validation + DB `NOT NULL`

|   |
| - |

422 DATES\_REQUIRED

|   |
| - |

BR-02

|   |
| - |

Leave cannot be submitted without a reason

|   |
| - |

API + BD `CHECK trim length`

|   |
| - |

422 REASON\_REQUIRED

|   |
| - |

BR-03

|   |
| - |

Medical documentation mandatory for medical leave exceeding two days

|   |
| - |

Domain service based on medical type + configured limit

|   |
| - |

422 MEDICAL\_DOCUMENT\_REQUIRED

|   |
| - |

BR-04

|   |
| - |

Block submit if mandatory medical doc missing

|   |
| - |

Same as BR-03;

|   |
| - |

422 MEDICAL\_DOCUMENT\_REQUIRED

|   |
| - |

BR-05

|   |
| - |

Medical documentation for 1–2 day medical leave is optional when enabled by policy.

|   |
| - |

`org_settings`

|   |
| - |

No error if optional

|   |
| - |

BR-06

|   |
| - |

Medical uploads PDF/JPG/JPEG/PNG

|   |
| - |

Upload service + `CHECK `content\_type (format)+ magic bytes (entifying bytes at the beginning of the file that indicate its real format)

|   |
| - |

422 UNSUPPORTED\_MEDIA\_TYPE

|   |
| - |

BR-07

|   |
| - |

No overlapping leave

|   |
| - |

Leave service + transaction overlap check

|   |
| - |

409 LEAVE\_OVERLAP

|   |
| - |

BR-08

|   |
| - |

Weekend/holiday include/exclude configurable

|   |
| - |

Day-count service + `org_settings`

|   |
| - |

Configuration-based

|   |
| - |

BR-09 / INT-01

|   |
| - |

Approved leave reflects On Leave

|   |
| - |

Approval transaction

|   |
| - |

Transaction rolls back on failure

|   |
| - |

BR-10

|   |
| - |

Employees cannot directly modify attendance

|   |
| - |

API + authorization

|   |
| - |

403 Forbidden

|   |
| - |

BR-11

|   |
| - |

Employee attendance changes via correction request

|   |
| - |

Correction APIs

|   |
| - |

—

|   |
| - |

AT-COR-11

|   |
| - |

Admin **may** modify attendance without a correction

|   |
| - |

Admin PATCH +  audit

|   |
| - |

403 if not authorized( not admin)

|   |
| - |

BR-12 / AUD-01

|   |
| - |

Every change in audit log

|   |
| - |

Mutation + audit transaction

|   |
| - |

Entire transaction fails if audit insert fails

|   |
| - |

BR-13

|   |
| - |

Employees can  view only own leave/attendance

|   |
| - |

Auth + RLS

|   |
| - |

404/403

|   |
| - |

BR-14

|   |
| - |

Admin/Guest Admin can read organization-wide data; Admin can perform permitted writes.

|   |
| - |

Authorization

|   |
| - |

403

|   |
| - |

BR-15 \*

|   |
| - |

Reporting Manager approval inside the application

|   |
| - |

No manager-approve API

|   |
| - |

—

|   |
| - |

BR-16

|   |
| - |

HR reviews after manager confirmation

|   |
| - |

Leave workflow validation

|   |
| - |

422 MANAGER\_PROOF\_REQUIRED

|   |
| - |

LV-WF-13

|   |
| - |

Employees without a reporting manager go directly to HR without manager proof.

|   |
| - |

Leave submission validation

|   |
| - |

—

|   |
| - |

LV-WF-07

|   |
| - |

HR may request clarification while the request is `PENDING_HR_REVIEW`.

|   |
| - |

Leave workflow

|   |
| - |

409 if not pending

|   |
| - |

LV-TYPE-06

|   |
| - |

Leave types are restricted based on their configured eligibility rules, such as males cannot apply for maternity

|   |
| - |

Leave submission validation

|   |
| - |

422 LEAVE\_TYPE\_NOT\_ELIGIBLE

|   |
| - |

LV-TYPE-07

|   |
| - |

No prior information → unpaid

|   |
| - |

Leave submission

|   |
| - |

Applied as snapshot, not error

|   |
| - |

LV-DATE-06

|   |
| - |

Leave cannot be submitted more than the configured advance limit. Max advance ½ week

|   |
| - |

Date validation

|   |
| - |

422 TOO\_FAR\_AHEAD

|   |
| - |

LV-DUR-09

|   |
| - |

First 4 hours after `work_start` represent the first half; remaining scheduled hours represent the second half.

|   |
| - |

Attendance/leave time calculation

|   |
| - |

Used in half-day leave + attendance

|   |
| - |

CAL-07

|   |
| - |

Weekends and holidays are excluded from leave day-counting and are not added as sandwich leave.

|   |
| - |

Day-count never adds those days as leave

|   |
| - |

—

|   |
| - |

MED-09

|   |
| - |

Only HR/Admin (admin + guest\_admin) view medical docs

|   |
| - |

Storage/API authorization

|   |
| - |

403

|   |
| - |

INT-03

|   |
| - |

If leave is approved after attendance punches exist, create a correction request instead of overwriting punches.

|   |
| - |

Approval transaction

|   |
| - |

200 + `correctionId`

|   |
| - |

LV-STS-10

|   |
| - |

Cancelling/withdrawing approved leave creates a correction request instead of directly overwriting attendance.

|   |
| - |

Cancellation transaction

|   |
| - |

200 + `correctionId`

|   |
| - |

LV-APP-18

|   |
| - |

HR absence workflow

|   |
| - |

**Not specified**

|   |
| - |

OPEN — no implementation

|   |
| - |

BR-18

|   |
| - |

Duplicate check-in/out prevented

|   |
| - |

Validation

|   |
| - |

`409 ALREADY_CHECKED_IN` if enabled

|   |
| - |

BR-19

|   |
| - |

No check-out without check-in

|   |
| - |

Validation

|   |
| - |

`409 NO_CHECK_IN` if enabled

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

BR-21

|   |
| - |

Server time is authoritative; client/device punch timestamps are not trusted

|   |
| - |

Server clock

|   |
| - |

Ignore client punch timestamps

|   |
| - |

|   |
| - |

|   |
| - |

|   |
| - |

---

## **Day-count algorithm (confirmed pieces)**

|   |
| - |

**Step**
**Rule / Definition**

|   |
| - |

1\. Date Range

|   |
| - |

Build an inclusive date range from `start_date` to `end_date`, including both dates.

|   |
| - |

2\. Half-Day

|   |
| - |

TD: A half-day is currently calculated as `0.5` day. 

|   |
| - |

3\. Full-Day

|   |
| - |

Count a qualifying full-day as 1 day.

|   |
| - |

4\. Weekends

|   |
| - |

Exclude weekends when `leave_count_excludes_weekends` is enabled.

|   |
| - |

5\. Holidays

|   |
| - |

Exclude holidays when `leave_count_excludes_holidays` is enabled.

|   |
| - |

6\. Sandwich Leave

|   |
| - |

Excluded weekends/holidays are not added back as leave days (CAL-07).

|   |
| - |

7\. Zero Days

|   |
| - |

If the final calculated leave is `0`, reject the request with `422 LEAVE_DAYS_ZERO`.

|   |
| - |

8\. Medical Leave Threshold

|   |
| - |

TD: Medical documentation is required when `calculated_days > 2`. The exact “exceeding two days” rule remains OPEN (MED-12).

---

## **Overlap (BR-07)**

|   |
| - |

**Topic**
**Definition / Rule**

|   |
| - |

Date overlap

|   |
| - |

Leave requests are considered overlapping when their date ranges intersect.

|   |
| - |

Half-day overlap

|   |
| - |

For two `HALF_DAY` leaves on the same date, compare their `half_session` values. First Half + Second Half are not considered overlapping.

|   |
| - |

Blocking statuses

|   |
| - |

**OPEN**: The requirements do not yet confirm which leave statuses should block a new request.

|   |
| - |

**Technical recommendation**

|   |
| - |

Exclude `DRAFT`, `REJECTED`, `CANCELLED`, and `WITHDRAWN`. Include `SUBMITTED`, `PENDING_HR_REVIEW`, and `APPROVED`. Requires sign-off before implementation.

---

## **Attendance status labels** 

|   |
| - |

**Label**
**TD Rule / Definition (Not Yet Confirmed)**

|   |
| - |

Weekly Off

|   |
| - |

`work_date` falls on a configured weekly-off day (`weekly_off_dow`) and there is no approved leave.

|   |
| - |

Holiday

|   |
| - |

`work_date` is listed as a public holiday in `public_holidays` and there is no approved leave.

|   |
| - |

On Leave

|   |
| - |

Approved full-day leave covers the `work_date`.

|   |
| - |

Half-Day

|   |
| - |

Approved half-day leave applies to the `work_date`.

|   |
| - |

Present

|   |
| - |

Employee has both check-in and check-out, and is not covered by full-day leave.

|   |
| - |

Missing Check-Out

|   |
| - |

Employee has checked in but has no check-out on a working day after `work_end`. 

|   |
| - |

Missing Check-In

|   |
| - |

Employee has a check-out without a check-in.

|   |
| - |

Absent

|   |
| - |

Working day with no attendance punch and no approved leave (Unauthorized Absence). (**Clarification Required**)
Do not invent “Unauthorized absence” as a stored status (not in BRD list).

## **Two half-days same date \*(**Not explicitly confirmed**)**

# **State machines**

Derived from LV-STS-01–07, LV-WF-05–07, AT-COR, punch flow. Clarification is **not** a BRD status (LV-WF-07 uses comment on Pending HR Review).

---

## **1. Leave application**

**SUBMITTED:** Confirmed status (LV-STS-02). **Technical decision:** on submit, write history `DRAFT|∅ → SUBMITTED → PENDING_HR_REVIEW` in one transaction and persist **current** `PENDING_HR_REVIEW`. `SUBMITTED` is recorded in `leave_status_history` so the lifecycle is tracked without a stuck inbox state.

|   |
| - |

**Transition**
**Who**
**Preconditions**
**Side effects**
**Invalid**

|   |
| - |

→ DRAFT

|   |
| - |

employee (own)

|   |
| - |

—

|   |
| - |

audit

|   |
| - |

—

|   |
| - |

DRAFT → PENDING\_HR\_REVIEW

|   |
| - |

employee

|   |
| - |

validations BR-01–07, MED, proof unless LV-WF-13

|   |
| - |

notify HR (NOTIF-01)

|   |
| - |

422/409

|   |
| - |

Pending + clarify

|   |
| - |

admin

|   |
| - |

status pending

|   |
| - |

NOTIF to employee; clarification\_comment

|   |
| - |

409 wrong status

|   |
| - |

Employee update after clarify

|   |
| - |

employee

|   |
| - |

pending + clarification\_comment set

|   |
| - |

clear waiting flag; notify HR

|   |
| - |

403 others

|   |
| - |

→ APPROVED

|   |
| - |

admin only

|   |
| - |

pending; row\_version

|   |
| - |

INT-01 On Leave; INT-03 if punches exist; NOTIF-02

|   |
| - |

guest\_admin 403; self-approve **TD deny**

|   |
| - |

→ REJECTED

|   |
| - |

admin

|   |
| - |

pending; hr\_comments required

|   |
| - |

NOTIF-03/04; no attendance write-back

|   |
| - |

422 comment

|   |
| - |

→ WITHDRAWN from pending

|   |
| - |

employee (own)

|   |
| - |

pending

|   |
| - |

no On Leave

|   |
| - |

**OPEN** if admin also

|   |
| - |

APPROVED → CANCELLED/WITHDRAWN

|   |
| - |

**OPEN who**; LV-STS-10

|   |
| - |

approved

|   |
| - |

create SYSTEM\_STS10 correction; do not silently clear On Leave until correction applied

|   |
| - |

—
**guest\_admin:** no transitions.
**Invalid:** employee approve; approve/reject terminal states; skip manager proof when manager exists (LV-WF-09).

---

## **2. Attendance day (punches)**

Confirmed: check-in records date+time; check-out records time. Duplicate/out-without-in are **Proposed**.
If Proposed AT-06–08 / BR-18–19 are **accepted as TD**:

|   |
| - |

**Event**
**Result**

|   |
| - |

Second check-in

|   |
| - |

409 ALREADY\_CHECKED\_IN

|   |
| - |

Check-out with no check-in

|   |
| - |

409 NO\_CHECK\_IN

|   |
| - |

Check-in after closed

|   |
| - |

409 DAY\_ALREADY\_CLOSED
Admin PATCH (AT-COR-11) may set times directly; `admin_modified = true`; audit (AT-COR-12 Proposed — **TD log anyway** because BR-12 every change).

---

## **3. Attendance correction**

BRD: request sent to HR for **review**. Approve/reject outcomes are **technical necessity**.

|   |
| - |

**Transition**
**Who**
**Side effects**

|   |
| - |

Create

|   |
| - |

employee (own) or system (INT-03, LV-STS-10)

|   |
| - |

notify admin **TD**

|   |
| - |

Approve

|   |
| - |

admin

|   |
| - |

overwrite punches; GUC/service path; audit

|   |
| - |

Reject

|   |
| - |

admin

|   |
| - |

comment; no punch change
guest\_admin: read only.
Correction type enum: **OPEN** (store text).

# **Authentication and authorization**

## **Authentication (AUTH-10)**

**Confirmed method:** email and password. 
**Mechanism:** Supabase Auth (project stack). Do not add a parallel (your own) password store. 

|   |
| - |

**Topic**
**Design / Definition**

|   |
| - |

Login

|   |
| - |

`POST /auth/login` authenticates the user through Supabase `signInWithPassword` and returns the access token to the client.

|   |
| - |

Session

|   |
| - |

Uses Supabase access and refresh tokens. Access-token expiry is a technical decision; recommended: 1 hour, with refresh handled according to the Supabase project configuration. (**\* requires confirmation**)

|   |
| - |

Password Management

|   |
| - |

`POST /auth/forgot-password` triggers the Supabase password-reset email. `POST /auth/update-password` allows an authenticated user to set a new password.

|   |
| - |

Provisioning

|   |
| - |

Admin `POST /employees` creates the corresponding Supabase `auth.users`, `public.users`, and `employees` records. he employee receives an invitation to set up/access their account rather than the admin manually giving them a password. (**\* requires confirmation**)

|   |
| - |

Clock

|   |
| - |

The server validates the JWT `exp` (expiration time) to ensure the access token has not expired.

|   |
| - |

**Topic**
**Definition**

|   |
| - |

SSO / External IdP

|   |
| - |

Not included in the current requirements; no SSO integration is designed.

|   |
| - |

Unauthorized (`401`)

|   |
| - |

User is not authenticated or has an invalid/expired token.

|   |
| - |

Forbidden (`403`)

|   |
| - |

User is authenticated but does not have permission for the requested action/resource.

|   |
| - |

Resource Not Found (`404`)

|   |
| - |

Employee accessing another employee's UUID returns `404` to avoid revealing whether the resource exists. TD — requires confirmation.

---

## **Roles (AUTH-09 + AUTH-08)** 

|   |
| - |

**Role**
**Definition / Responsibility**

|   |
| - |

`employee`

|   |
| - |

Can access and manage their own leave and attendance only, including submitting leave, punching attendance, and requesting attendance corrections.

|   |
| - |

`admin`

|   |
| - |

Full HR/Admin role. Can manage employees, leave types, calendars, approvals, attendance, reports, and medical documents. Can also directly modify attendance as permitted by `AT-COR-11`.

|   |
| - |

`guest_admin`

|   |
| - |

Organization-wide read-only role. Can view dashboards, reports, leave, attendance, and medical documents, but cannot perform mutations.

## **Permission matrix (server-side)**

|   |
| - |

**Action**
**employee**
**admin**
**guest\_admin**

|   |
| - |

Punch / own leave submit / own correction

|   |
| - |

yes

|   |
| - |

yes 

|   |
| - |

no

|   |
| - |

View own leave/attendance

|   |
| - |

yes

|   |
| - |

yes

|   |
| - |

n/a

|   |
| - |

View others' leave/attendance

|   |
| - |

no

|   |
| - |

yes

|   |
| - |

yes

|   |
| - |

Approve/reject/clarify leave

|   |
| - |

no

|   |
| - |

yes

|   |
| - |

no

|   |
| - |

Cancel/withdraw own

|   |
| - |

yes (where allowed)

|   |
| - |

yes

|   |
| - |

no

|   |
| - |

PATCH attendance direct

|   |
| - |

no

|   |
| - |

yes

|   |
| - |

no

|   |
| - |

Review corrections

|   |
| - |

no

|   |
| - |

yes

|   |
| - |

no

|   |
| - |

Manage employees/types/holidays/org

|   |
| - |

no

|   |
| - |

yes

|   |
| - |

no

|   |
| - |

GET medical document

|   |
| - |

no

|   |
| - |

yes

|   |
| - |

yes

|   |
| - |

Reports / HR dashboard

|   |
| - |

no

|   |
| - |

yes

|   |
| - |

yes

|   |
| - |

View audit log

|   |
| - |

no

|   |
| - |

recommend yes

|   |
| - |

recommend no
**Self-approve:** Self-approval is not defined in the requirements.  **(\* Clarification Required)**: `admin` cannot approve or reject their own leave; return `403 SELF_APPROVAL_FORBIDDEN`.
**Resource rule:** `employee` may only access rows where `employee_id` matches their profile.
**Manager:** Managers approves the leave within the application.

---

## **RLS (defense in depth)**

RLS (Row Level Security) is a database-level security feature that controls which rows a user can access or modify.

|   |
| - |

**Table**
**employee**
**admin / guest\_admin**

|   |
| - |

leave\_applications

|   |
| - |

own

|   |
| - |

all

|   |
| - |

attendance\_days

|   |
| - |

own

|   |
| - |

all

|   |
| - |

documents kind MEDICAL

|   |
| - |

none

|   |
| - |

all

|   |
| - |

documents other own

|   |
| - |

own

|   |
| - |

all

|   |
| - |

audit\_events

|   |
| - |

none

|   |
| - |

admin only (until AUD-08)
Express still enforces the same rules (do not rely on RLS alone if using service role).

# **API specification**

**Base URL:** `/api/v1` All API endpoints use `/api/v1` as the base path.
**Authentication:** `Authorization: Bearer <access_token>. `Required for all authenticated endpoints except login and forgot-password.
**Roles:**
`E` = `employee`
`A` = `admin`
`G` = `guest_admin`
**Standards:**
API conventions follow `backend-architecture.md`.
**Excluded APIs:**
No **overtime APIs**, **leave-balance APIs**, or **Teams/Slack APIs** are included.

---

## **Inventory**

|   |
| - |

**Method**
**Endpoint**
**Purpose**
**Auth**
**Role**
**Request**
**Response**
**Errors**

|   |
| - |

POST

|   |
| - |

`/auth/login`

|   |
| - |

Email/password

|   |
| - |

public

|   |
| - |

—

|   |
| - |

`{email,password}`

|   |
| - |

`{accessToken,expiresIn,user}`

|   |
| - |

401 INVALID\_CREDENTIALS

|   |
| - |

POST

|   |
| - |

`/auth/refresh`

|   |
| - |

Refresh session

|   |
| - |

refresh

|   |
| - |

—

|   |
| - |

—

|   |
| - |

`{accessToken}`

|   |
| - |

401

|   |
| - |

POST

|   |
| - |

`/auth/logout`

|   |
| - |

End session

|   |
| - |

Bearer

|   |
| - |

\*

|   |
| - |

—

|   |
| - |

204

|   |
| - |

401

|   |
| - |

POST

|   |
| - |

`/auth/forgot-password`

|   |
| - |

Reset email

|   |
| - |

public

|   |
| - |

—

|   |
| - |

`{email}`

|   |
| - |

204

|   |
| - |

204 always **TD**

|   |
| - |

POST

|   |
| - |

`/auth/update-password`

|   |
| - |

Change password

|   |
| - |

Bearer

|   |
| - |

\*

|   |
| - |

`{newPassword}`

|   |
| - |

204

|   |
| - |

401 422

|   |
| - |

GET

|   |
| - |

`/auth/me`

|   |
| - |

Current user + employee

|   |
| - |

Bearer

|   |
| - |

\*

|   |
| - |

—

|   |
| - |

`UserDto`

|   |
| - |

401

|   |
| - |

GET

|   |
| - |

`/employees`

|   |
| - |

List

|   |
| - |

Bearer

|   |
| - |

A G

|   |
| - |

query department,  isActive ,page

|   |
| - |

list

|   |
| - |

403

|   |
| - |

POST

|   |
| - |

`/employees`

|   |
| - |

Provision

|   |
| - |

Bearer

|   |
| - |

A

|   |
| - |

defined below

|   |
| - |

`EmployeeAdminDto` 201

|   |
| - |

409 EMAIL\_IN\_USE

|   |
| - |

GET

|   |
| - |

`/employees/{id}`

|   |
| - |

Get

|   |
| - |

Bearer

|   |
| - |

A G or self

|   |
| - |

—

|   |
| - |

dto

|   |
| - |

404

|   |
| - |

PATCH

|   |
| - |

`/employees/{id}`

|   |
| - |

Update/deactivate

|   |
| - |

Bearer

|   |
| - |

A

|   |
| - |

patch fields

|   |
| - |

dto

|   |
| - |

403 409

|   |
| - |

GET

|   |
| - |

`/leave-types`

|   |
| - |

List types

|   |
| - |

Bearer

|   |
| - |

\*

|   |
| - |

—

|   |
| - |

E: active only

|   |
| - |

401

|   |
| - |

POST

|   |
| - |

`/leave-types`

|   |
| - |

Create

|   |
| - |

Bearer

|   |
| - |

A

|   |
| - |

type body

|   |
| - |

201

|   |
| - |

409 CODE\_IN\_USE

|   |
| - |

PATCH

|   |
| - |

`/leave-types/{id}`

|   |
| - |

Edit/deactivate

|   |
| - |

Bearer

|   |
| - |

A

|   |
| - |

patch

|   |
| - |

dto

|   |
| - |

404

|   |
| - |

DELETE

|   |
| - |

`/leave-types/{id}`

|   |
| - |

Delete if unused

|   |
| - |

Bearer

|   |
| - |

A

|   |
| - |

—

|   |
| - |

204

|   |
| - |

409 IN\_USE

|   |
| - |

GET \*

|   |
| - |

`/org-settings`

|   |
| - |

Policy/working hours settings

|   |
| - |

Bearer

|   |
| - |

\*

|   |
| - |

—

|   |
| - |

dto

|   |
| - |

401

|   |
| - |

PATCH

|   |
| - |

`/org-settings`

|   |
| - |

Configure

|   |
| - |

Bearer

|   |
| - |

A

|   |
| - |

patch

|   |
| - |

dto

|   |
| - |

403 VERSION\_CONFLICT

|   |
| - |

GET \*

|   |
| - |

`/holidays`

|   |
| - |

List

|   |
| - |

Bearer

|   |
| - |

\*

|   |
| - |

from,to

|   |
| - |

list

|   |
| - |

401

|   |
| - |

POST \*

|   |
| - |

`/holidays`

|   |
| - |

Add

|   |
| - |

Bearer

|   |
| - |

A

|   |
| - |

`{date,name}`

|   |
| - |

201

|   |
| - |

409 DATE\_EXISTS

|   |
| - |

DELETE \*

|   |
| - |

`/holidays/{id}`

|   |
| - |

Remove

|   |
| - |

Bearer

|   |
| - |

A

|   |
| - |

—

|   |
| - |

204

|   |
| - |

404

|   |
| - |

POST

|   |
| - |

`/documents`

|   |
| - |

Upload

|   |
| - |

Bearer

|   |
| - |

E A

|   |
| - |

multipart `file`, optional `kind`

|   |
| - |

`{id,contentType,byteSize}`

|   |
| - |

422 media/size

|   |
| - |

GET

|   |
| - |

`/documents/{id}`

|   |
| - |

Download

|   |
| - |

Bearer

|   |
| - |

A G;  E (own)

|   |
| - |

—

|   |
| - |

stream

|   |
| - |

403 medical

|   |
| - |

POST

|   |
| - |

`/leaves`

|   |
| - |

Submit (or create pending)

|   |
| - |

Bearer

|   |
| - |

E

|   |
| - |

leave body

|   |
| - |

`LeaveDetailDto` 201

|   |
| - |

422 409

|   |
| - |

POST

|   |
| - |

`/leaves/drafts`

|   |
| - |

Save draft

|   |
| - |

Bearer

|   |
| - |

E

|   |
| - |

leave body

|   |
| - |

201 DRAFT

|   |
| - |

422

|   |
| - |

GET

|   |
| - |

`/leaves`

|   |
| - |

List

|   |
| - |

Bearer

|   |
| - |

E own; A G all

|   |
| - |

status, from, to, employeeId, type ,page

|   |
| - |

list

|   |
| - |

403

|   |
| - |

GET

|   |
| - |

`/leaves/{id}`

|   |
| - |

Detail

|   |
| - |

Bearer

|   |
| - |

owner A G

|   |
| - |

—

|   |
| - |

detail + docs meta

|   |
| - |

404

|   |
| - |

PATCH

|   |
| - |

`/leaves/{id}`

|   |
| - |

Edit draft or after clarify

|   |
| - |

Bearer

|   |
| - |

E owner

|   |
| - |

patch

|   |
| - |

dto

|   |
| - |

409 not editable

|   |
| - |

POST

|   |
| - |

`/leaves/{id}/submit`

|   |
| - |

Draft → pending

|   |
| - |

Bearer

|   |
| - |

E owner

|   |
| - |

optional body

|   |
| - |

dto

|   |
| - |

422 409

|   |
| - |

POST

|   |
| - |

`/leaves/{id}/approve`

|   |
| - |

Approve

|   |
| - |

Bearer

|   |
| - |

A

|   |
| - |

`{rowVersion}`

|   |
| - |

dto + correctionId?

|   |
| - |

409 403 self

|   |
| - |

POST

|   |
| - |

`/leaves/{id}/reject`

|   |
| - |

Reject

|   |
| - |

Bearer

|   |
| - |

A

|   |
| - |

`{comment,rowVersion}`

|   |
| - |

dto

|   |
| - |

422 comment

|   |
| - |

POST

|   |
| - |

`/leaves/{id}/clarification`

|   |
| - |

Request clarification

|   |
| - |

Bearer

|   |
| - |

A

|   |
| - |

`{comment}`

|   |
| - |

dto

|   |
| - |

409

|   |
| - |

POST

|   |
| - |

`/leaves/{id}/withdraw`

|   |
| - |

Withdraw

|   |
| - |

Bearer

|   |
| - |

E owner

|   |
| - |

—

|   |
| - |

dto + correctionId?

|   |
| - |

409

|   |
| - |

POST

|   |
| - |

`/leaves/{id}/cancel`

|   |
| - |

Cancel

|   |
| - |

Bearer

|   |
| - |

E A

|   |
| - |

—

|   |
| - |

dto + correctionId?

|   |
| - |

409 OPEN who-after-approve

|   |
| - |

POST

|   |
| - |

`/attendance/check-in`

|   |
| - |

Punch in

|   |
| - |

Bearer

|   |
| - |

E

|   |
| - |

empty; Idempotency-Key

|   |
| - |

AttendanceDayDto

|   |
| - |

409 

|   |
| - |

POST

|   |
| - |

`/attendance/check-out`

|   |
| - |

Punch out

|   |
| - |

Bearer

|   |
| - |

E

|   |
| - |

empty

|   |
| - |

dto

|   |
| - |

409

|   |
| - |

GET

|   |
| - |

`/attendance/me`

|   |
| - |

History + month summary

|   |
| - |

Bearer

|   |
| - |

E

|   |
| - |

from,to

|   |
| - |

days + counts

|   |
| - |

401

|   |
| - |

GET

|   |
| - |

`/attendance/me/dashboard`

|   |
| - |

Today + late/missing

|   |
| - |

Bearer

|   |
| - |

E

|   |
| - |

—

|   |
| - |

dashboard EST

|   |
| - |

401

|   |
| - |

GET

|   |
| - |

`/attendance`

|   |
| - |

Org attendance

|   |
| - |

Bearer

|   |
| - |

A G

|   |
| - |

date or from,to,employeeId

|   |
| - |

list

|   |
| - |

403

|   |
| - |

PATCH

|   |
| - |

`/attendance/{id}`

|   |
| - |

Admin direct edit

|   |
| - |

Bearer

|   |
| - |

A

|   |
| - |

times, reason

|   |
| - |

dto

|   |
| - |

403 G; audit

|   |
| - |

GET

|   |
| - |

`/hr/dashboard`

|   |
| - |

HR-DASH-01–08

|   |
| - |

Bearer

|   |
| - |

A G

|   |
| - |

date optional

|   |
| - |

counts EST

|   |
| - |

403

|   |
| - |

POST

|   |
| - |

`/attendance/corrections`

|   |
| - |

Employee correction

|   |
| - |

Bearer

|   |
| - |

E

|   |
| - |

correction body

|   |
| - |

201

|   |
| - |

422

|   |
| - |

GET

|   |
| - |

`/attendance/corrections`

|   |
| - |

List

|   |
| - |

Bearer

|   |
| - |

E own; A G all

|   |
| - |

status

|   |
| - |

list

|   |
| - |

403

|   |
| - |

GET

|   |
| - |

`/attendance/corrections/{id}`

|   |
| - |

Detail

|   |
| - |

Bearer

|   |
| - |

owner A G

|   |
| - |

—

|   |
| - |

dto

|   |
| - |

404

|   |
| - |

POST

|   |
| - |

`/attendance/corrections/{id}/approve`

|   |
| - |

Apply times

|   |
| - |

Bearer

|   |
| - |

A

|   |
| - |

`{rowVersion}`

|   |
| - |

dto

|   |
| - |

409

|   |
| - |

POST

|   |
| - |

`/attendance/corrections/{id}/reject`

|   |
| - |

Reject

|   |
| - |

Bearer

|   |
| - |

A

|   |
| - |

`{comment}`

|   |
| - |

dto

|   |
| - |

422

|   |
| - |

GET

|   |
| - |

`/notifications`

|   |
| - |

In-app

|   |
| - |

Bearer

|   |
| - |

\*

|   |
| - |

unread,page

|   |
| - |

list

|   |
| - |

401

|   |
| - |

POST

|   |
| - |

`/notifications/{id}/read`

|   |
| - |

Mark read

|   |
| - |

Bearer

|   |
| - |

owner

|   |
| - |

—

|   |
| - |

204

|   |
| - |

404

|   |
| - |

GET

|   |
| - |

`/reports/{placeholder}`

|   |
| - |

Reports REP-01–10

|   |
| - |

Bearer

|   |
| - |

A G

|   |
| - |

from,to,employeeId,department,leaveTypeId,format

|   |
| - |

JSON or file

|   |
| - |

403 422

|   |
| - |

GET

|   |
| - |

`/audit`

|   |
| - |

Audit viewer

|   |
| - |

Bearer

|   |
| - |

A

|   |
| - |

entity, id, from, to

|   |
| - |

list

|   |
| - |

403; AUD-08 OPEN

---

## **Leave submit body**

```json
{
  "leaveTypeId": "uuid",
  "days": [
    {
      "date": "2026-09-01",
      "durationMode": "FULL_DAY"
    },
    {
      "date": "2026-09-02",
      "durationMode": "FULL_DAY"
    },
    {
      "date": "2026-09-03",
      "durationMode": "HALF_DAY",
      "halfSession": "FIRST"
    }
  ],
  "reason": "string",
  "managerApprovalAttested": true,
  "documentIds": ["uuid"]
}
```

**Required fields:** `type`, `start`, `end`, `durationMode`, `reason`.
`halfSession` is required when `durationMode = HALF_DAY`.
**Manager approval:** `managerApprovalAttested = true` is required when the employee has a reporting manager (`LV-WF-09`). Optional manager-proof document uses kind `MANAGER_PROOF`.
**Auto-populated fields:** `employeeName`, `department`, and `reportingManagerName` are returned automatically. `department` and `reportingManagerName` may be `null` (`EMP-02–04`, `EMP-06`).
**Validation:** Applies required-field, overlap, medical-document, advance-window, eligibility, and positive day-count rules (`BR-01–07`).

---

## **Correction body**

```json
{
  "workDate": "2026-08-20",
  "correctionType": "CHECK_IN_OUT",
  "proposedCheckInAt": "2026-08-20T12:30:00.000Z",
  "proposedCheckOutAt": "2026-08-20T20:30:00.000Z",
  "reason": "Forgot to check in and check out",
  "documentIds": []
}
```

CHECK\_IN CHECK\_OUT CHECK\_IN\_OUT

## **Admin attendance PATCH**

```json
{
  "checkInAt": "ISO-8601",
  "checkOutAt": "ISO-8601",
  "reason": "required for audit",
  "rowVersion": 2
}
```

AT-COR-11. Always `audit_events` (BR-12).

---

## **Report slugs**

|   |
| - |

**slug**
**REP**

|   |
| - |

leave-employee

|   |
| - |

REP-01

|   |
| - |

leave-department

|   |
| - |

REP-02

|   |
| - |

leave-monthly

|   |
| - |

REP-03

|   |
| - |

leave-type

|   |
| - |

REP-04

|   |
| - |

leave-decisions

|   |
| - |

REP-05

|   |
| - |

attendance-daily

|   |
| - |

REP-06

|   |
| - |

attendance-monthly

|   |
| - |

REP-07

|   |
| - |

attendance-employee

|   |
| - |

REP-08

|   |
| - |

attendance-late

|   |
| - |

REP-09

|   |
| - |

attendance-missing-logout

|   |
| - |

REP-10
`format=xlsx|csv|pdf` (REP-11–13). Default JSON. Filters: `from`,`to` required **TD** until REP-14 signed; optional employeeId, department, leaveTypeId.
Cancelled/withdrawn/rejected/corrected inclusion: **OPEN REP-16**. **TD:** leave-decisions includes approved+rejected only; cancelled/withdrawn excluded unless query `includeInactive=true`.

---

## **Error codes (selected)**

`INVALID_CREDENTIALS` `USER_INACTIVE`, `LEAVE_OVERLAP`, `MEDICAL_DOCUMENT_REQUIRED`, `MANAGER_PROOF_REQUIRED`, `LEAVE_TYPE_NOT_ELIGIBLE`, `TOO_FAR_AHEAD`, `LEAVE_DAYS_ZERO`, `LEAVE_INVALID_TRANSITION`, `VERSION_CONFLICT`, `ALREADY_CHECKED_IN`, `NO_CHECK_IN`, `FILE_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`, `SELF_APPROVAL_FORBIDDEN`, `EMAIL_IN_USE`.

# **API / business workflows**

Common prefix: **Trigger → API → Authenticate JWT → Authorize role/resource → Validate → Transaction → Notify → Audit → Response**. On any error inside the transaction: **rollback** including audit (audit is part of the TX).
Notifications (NOTIF-\*) run **after successful commit** (so a notify failure does not undo leave). Persist `notifications` row **inside** the TX; email send is async (**TD**).

---

## **1. Leave submit**

PostgresExpressClientPostgresExpressClientPOST /leavesJWT + role employeeBEGIN employee FOR UPDATEday-count, overlap, medical, proof, eligibilityinsert leave PENDING\_HR\_REVIEW history audit notificationCOMMIT201 LeaveDetailDto

1. Trigger: employee submits.
2. API: `POST /leaves` or `POST /leaves/{id}/submit`.
   3–5. Auth employee; own employee\_id.
3. Rules: BR-01–07, LV-DATE-06, LV-TYPE-06/07, LV-WF-09/13, MED-\*.
4. DB: insert application, attach documents, history SUBMITTED then PENDING\_HR\_REVIEW, notification NOTIF-01 to all `admin` (+ guest\_admin **TD** in-app).
5. TX: single.
6. State: PENDING\_HR\_REVIEW.
7. NOTIF-01. NOTIF-05 is **in-form** 422 MEDICAL\_DOCUMENT\_REQUIRED (not a separate channel after failed submit).
8. Audit LEAVE\_SUBMIT.
9.

201)

- Failure: 422/409; no partial leave.

**Idempotency-Key** required.

---

## **2. Leave approval**

1. Trigger: admin approve.
2. `POST /leaves/{id}/approve`.
   3–4. Role admin; **TD** not self.
3. Status must be PENDING\_HR\_REVIEW; If-Match row\_version.
4. INT-01: upsert `attendance_days` for counted working dates; `derived_status = ON_LEAVE` or `HALF_DAY`.
5. INT-03: if any of those dates already have check\_in/check\_out, **do not overwrite punches**; insert `attendance_corrections` `source=SYSTEM_INT03` SUBMITTED.
6. TX: leave + attendance links + optional corrections + history + audit + notification row.
7. APPROVED.
8. NOTIF-02 employee.
9. Audit LEAVE\_APPROVE.
10. 200 including `attendanceCorrectionIds` if any.
11. Rollback on conflict/version.

---

## **3. Leave rejection**

Admin `POST /leaves/{id}/reject` with `comment` (NOTIF-04). Status REJECTED. No attendance write-back. NOTIF-03+04. Audit.

---

## **4. Request clarification**

Admin `POST /leaves/{id}/clarification`. Status remains PENDING\_HR\_REVIEW. Set `clarification_comment`. Notify employee. Employee `PATCH /leaves/{id}` then remains pending; notify admin. **No new BRD status.**

---

## **5. Cancel / withdraw approved leave**

LV-STS-10: create `SYSTEM_STS10` correction (proposed times empty / proposed clear On Leave **TD**). Do not silently delete On Leave until admin approves that correction (or admin PATCH). **Who may cancel approved leave is OPEN**; APIs exist for employee withdraw and admin cancel pending product confirmation.

---

## **6. Check-in**

1. Trigger: employee button.
2. `POST /attendance/check-in`.
   3–4. Employee with profile.
3. Server `now()`. `work_date` = that instant in `America/New_York` (overnight: still check-in date).
4. Unique day row; set check\_in\_at; `is_late` vs work\_start+grace.
5. TX + audit ATTENDANCE\_CHECK\_IN.
6. Duplicate: if Proposed AT-06 accepted as TD → 409.
7. No notification.
8. 200 AttendanceDayDto.

Check-out: set check\_out\_at; Proposed AT-08/BR-19 → 409 NO\_CHECK\_IN if null check-in.
Duration: `check_out_at - check_in_at` (can span midnight).

---

## **7. Late / missing / absent**

Not separate APIs. Derived on read and by optional jobs (NOTIF-06/07). Qualification of Absent vs Missing Check-In **OPEN** (§14). Jobs must not invent Unauthorized Absence status.

---

## **8. Employee correction**

`POST /attendance/corrections` → SUBMITTED. HR `approve` overwrites punches in TX (lock day + correction). `reject` with comment. Employee never PATCHes `attendance_days` (BR-10).

---

## **9. Admin attendance modification**

`PATCH /attendance/{id}` (AT-COR-11). Reason required. `admin_modified=true`. Audit before/after (BR-12; AT-COR-12 Proposed but BR-12 already requires it). No correction row unless admin chooses to use the correction APIs instead.

---

## **10. Medical upload**

`POST /documents` then attach ids on leave. Magic bytes + allowlist. Technical max size until MED-06. GET medical: admin/guest\_admin only.

---

## **11. Transactions and concurrency**

|   |
| - |

**Operation**
**TX boundary**
**Locking**
**Idempotency**

|   |
| - |

Leave submit

|   |
| - |

one TX

|   |
| - |

employee FOR UPDATE + overlap SELECT

|   |
| - |

Idempotency-Key

|   |
| - |

Approve/reject/clarify

|   |
| - |

one TX

|   |
| - |

leave FOR UPDATE; attendance days in range

|   |
| - |

row\_version

|   |
| - |

Check-in/out

|   |
| - |

one TX

|   |
| - |

UNIQUE (employee\_id, work\_date)

|   |
| - |

Idempotency-Key

|   |
| - |

Correction approve

|   |
| - |

one TX

|   |
| - |

correction + day FOR UPDATE

|   |
| - |

row\_version

|   |
| - |

Admin PATCH attendance

|   |
| - |

one TX

|   |
| - |

day FOR UPDATE

|   |
| - |

row\_version

|   |
| - |

Cancel approved + SYSTEM correction

|   |
| - |

one TX

|   |
| - |

leave + insert correction

|   |
| - |

row\_version
No leave-balance races (no balances). Concurrent two submits: first commit wins overlap; second 409.
Isolation: READ COMMITTED + row locks.

---

## **12. HR dashboard / reports**

Read-only. Timezone `America/New_York`. “Today” = current Eastern date. Counts use `derived_status` where filled; document OPEN qualification in UI if null.

# **Audit, notifications, reporting**

## **Audit (AUD-01 / BR-12)**

Every **successful mutation** inserts one or more `audit_events` rows in the **same transaction**.

|   |
| - |

**Field**
**Content**

|   |
| - |

actor\_user\_id

|   |
| - |

JWT user; NULL only for system jobs

|   |
| - |

action

|   |
| - |

e.g. LEAVE\_SUBMIT, LEAVE\_APPROVE, LEAVE\_REJECT, LEAVE\_CLARIFY, LEAVE\_WITHDRAW, ATTENDANCE\_CHECK\_IN, ATTENDANCE\_CHECK\_OUT, ATTENDANCE\_ADMIN\_PATCH, CORRECTION\_CREATE, CORRECTION\_APPROVE, EMPLOYEE\_CREATE, ORG\_SETTINGS\_UPDATE, DOCUMENT\_UPLOAD, DOCUMENT\_DOWNLOAD

|   |
| - |

entity\_type / entity\_id

|   |
| - |

Target

|   |
| - |

before\_json / after\_json

|   |
| - |

Material change (AUD-07 Proposed — **TD include** because BR-12 “every change”)

|   |
| - |

occurred\_at

|   |
| - |

DB now()

|   |
| - |

ip / request\_id

|   |
| - |

From Express
AUD-02–04 Proposed scope: **TD implement** leave, attendance, employee, leave types, holidays, org\_settings, documents — because AUD-01 is Confirmed and those are the mutating domains.
**Viewer:** `GET /audit` admin only until AUD-08 is answered. guest\_admin: **TD no**.
Document download logging: enable `DOCUMENT_DOWNLOAD` for medical GET (**TD**, privacy).
History tables (`leave_status_history`) are **workflow history**, not a substitute for `audit_events`.

---

## **Notifications**

Channel: **in-app** (`notifications` table) + **email** (NOTIF list; BRD “potential” includes email). Teams/Slack **Future** (NOTIF-10) — not built.

|   |
| - |

**ID**
**Trigger**
**Recipient**
**Event**
**Channel**
**Payload**
**Timing**
**Retry**

|   |
| - |

NOTIF-01

|   |
| - |

Leave submitted

|   |
| - |

each admin (in-app also guest\_admin **TD**)

|   |
| - |

LEAVE\_SUBMITTED

|   |
| - |

in-app + email

|   |
| - |

leave id, employee name, dates

|   |
| - |

after commit

|   |
| - |

email: 3 retries backoff **TD**

|   |
| - |

NOTIF-02

|   |
| - |

Approved

|   |
| - |

employee

|   |
| - |

LEAVE\_APPROVED

|   |
| - |

in-app + email

|   |
| - |

leave id

|   |
| - |

after commit

|   |
| - |

same

|   |
| - |

NOTIF-03/04

|   |
| - |

Rejected

|   |
| - |

employee

|   |
| - |

LEAVE\_REJECTED

|   |
| - |

in-app + email

|   |
| - |

leave id, **hr comments**

|   |
| - |

after commit

|   |
| - |

same

|   |
| - |

NOTIF-05

|   |
| - |

Medical missing

|   |
| - |

employee

|   |
| - |

before submit

|   |
| - |

**API validation** 422 (and optional in-app if they save draft without doc)

|   |
| - |

fields

|   |
| - |

synchronous

|   |
| - |

n/a

|   |
| - |

NOTIF-06

|   |
| - |

Attendance not marked

|   |
| - |

employee

|   |
| - |

REMIND\_NO\_PUNCH

|   |
| - |

in-app + email

|   |
| - |

date

|   |
| - |

**schedule OPEN NOTIF-12**

|   |
| - |

job retry

|   |
| - |

NOTIF-07

|   |
| - |

Missing logout

|   |
| - |

employee

|   |
| - |

REMIND\_NO\_CHECKOUT

|   |
| - |

in-app + email

|   |
| - |

date

|   |
| - |

**OPEN NOTIF-12**

|   |
| - |

job retry
Timezone for reminder “today”: `America/New_York` (TZ-04).
Do not put medical file bytes in payload.

---

## **Reporting**

APIs: [**api-specification.md**](http://api-specification.md) slugs REP-01–13.

|   |
| - |

**Topic**
**Design**

|   |
| - |

Auth

|   |
| - |

admin + guest\_admin (AUTH-07); employees 403. REP-15 OPEN — this is the **TD** until signed

|   |
| - |

Date range

|   |
| - |

required `from`,`to` interpreted as Eastern civil dates

|   |
| - |

Pagination

|   |
| - |

JSON lists; file exports are full range with **TD** max 366 days

|   |
| - |

Sort

|   |
| - |

default date desc

|   |
| - |

Aggregation

|   |
| - |

monthly reports group by `date_trunc('month', work_date AT TIME ZONE 'America/New_York')` — use civil `work_date` / leave dates directly

|   |
| - |

Leave spanning months (EDGE-11)

|   |
| - |

attribute each **counted** day to its calendar month

|   |
| - |

Late / missing

|   |
| - |

from `is_late` and derived\_status / null checkout

|   |
| - |

Excel/CSV/PDF

|   |
| - |

same query, different serializer
Compatible with indexes in [**database-schema.md**](http://database-schema.md).

# **Technical decisions, open items, gap analysis**

## **Cross-validation**

|   |
| - |

**Check**
**Result**

|   |
| - |

Requirements ↔ Database

|   |
| - |

Confirmed data stored. No balance/overtime tables. Nullable department/manager (EMP-06). Medical docs isolated by `kind` + authz.

|   |
| - |

Requirements ↔ APIs

|   |
| - |

Each confirmed operation has an API or is explicitly in-form (NOTIF-05). LV-APP-18 has **no API** (undefined). Overtime none.

|   |
| - |

APIs ↔ Database

|   |
| - |

All inventory endpoints map to listed tables.

|   |
| - |

APIs ↔ Authorization

|   |
| - |

Matrix in authentication-authorization.md; guest\_admin read-only.

|   |
| - |

Workflows ↔ APIs / states

|   |
| - |

Submit/approve/reject/clarify/cancel/punches/corrections match state-machines.md.

|   |
| - |

ER ↔ Schema

|   |
| - |

Same entities; org\_settings and holidays standalone.

|   |
| - |

Rules ↔ layer

|   |
| - |

business-rules.md assigns API / domain / DB / TX / authz / jobs.

|   |
| - |

Timezone

|   |
| - |

Storage UTC timestamptz; civil dates; display EST via America/New\_York. Server clock for punches.

|   |
| - |

Transactions

|   |
| - |

Critical mutations listed in api-workflows.md §11. Unique day + employee lock on leave submit.

---

## **Confirmed (designed)**

- Roles: employee, admin, guest\_admin (AUTH-09); guest\_admin = read-only (AUTH-08).
- Auth: email/password via Supabase (AUTH-10).
- Employee manage; nullable department and reporting manager.
- Leave types configurable; seed four names; sex eligibility; unpaid-without-prior-notice.
- Leave apply half/full/multi; auto day-count; configurable weekend/holiday exclusion; first 4 hours = first half.
- Overlap prevented (predicate statuses still OPEN).
- Medical docs for medical leave > 2 days; formats; HR/admin (admin+guest) view.
- Workflow: manager outside app; proof required unless no manager; HR approve/reject/clarify; statuses Draft through Withdrawn.
- Approved leave → On Leave; approve-after-punch and cancel-approved → correction request.
- Check-in/out; employee cannot edit punches; employee corrections; **admin direct edit**.
- Holidays/weekly offs configurable; no sandwich fill of those days.
- Dashboards/reports Eastern Time; named reports + Excel/CSV/PDF.
- Notifications 01–07 (05 as validation); audit every change.
- No leave-balance module (not defined).

---

## **Technical decisions (not business requirements)**

|   |
| - |

**ID**
**Decision**
**Why**

|   |
| - |

TD-01

|   |
| - |

Express + Supabase Auth/DB/Storage; rules in Express

|   |
| - |

Project stack; complex TX

|   |
| - |

TD-02

|   |
| - |

UUID PKs; `users.id` = `auth.users.id`

|   |
| - |

Supabase

|   |
| - |

TD-03

|   |
| - |

IANA `America/New_York` for “EST”

|   |
| - |

DST-safe

|   |
| - |

TD-04

|   |
| - |

Punch timestamps = server `now()`, ignore client

|   |
| - |

Device clock untrusted (req note); TZ-01 Proposed

|   |
| - |

TD-05

|   |
| - |

`work_date` = Eastern date of check-in (overnight)

|   |
| - |

18:30–02:30 without full shift table

|   |
| - |

TD-06

|   |
| - |

Current leave status after submit = `PENDING_HR_REVIEW`; `SUBMITTED` in history

|   |
| - |

Both statuses confirmed

|   |
| - |

TD-07

|   |
| - |

Clarification is a comment on pending, not a new status

|   |
| - |

BRD status list has no Clarification

|   |
| - |

TD-08

|   |
| - |

Half-day `calculated_days = 0.5`

|   |
| - |

Need a number for MED threshold

|   |
| - |

TD-09

|   |
| - |

Max advance default **4 calendar days** (½ week)

|   |
| - |

LV-DATE-06

|   |
| - |

TD-10

|   |
| - |

Unpaid if `start_date <= today` Eastern (LV-TYPE-07)

|   |
| - |

“Without prior information”

|   |
| - |

TD-11

|   |
| - |

Sick type seeded `is_medical = true`

|   |
| - |

BRD medical leave vs types

|   |
| - |

TD-12

|   |
| - |

UNIQUE (employee\_id, work\_date)

|   |
| - |

Integrity; AT-06 still Proposed as **UX policy**

|   |
| - |

TD-13

|   |
| - |

Correction statuses SUBMITTED/APPROVED/REJECTED

|   |
| - |

Review needs an outcome

|   |
| - |

TD-14

|   |
| - |

Admin cannot approve own leave

|   |
| - |

Segregation of duties

|   |
| - |

TD-15

|   |
| - |

Invite email for provisioning

|   |
| - |

AUTH-10

|   |
| - |

TD-16

|   |
| - |

Access token \~1h

|   |
| - |

AUTH-10 session expiry shall be defined

|   |
| - |

TD-17

|   |
| - |

Technical upload cap 10 MiB until MED-06

|   |
| - |

Abuse protection

|   |
| - |

TD-18

|   |
| - |

In-app + email; notify row in TX, email after commit

|   |
| - |

Dual channel without Teams

|   |
| - |

TD-19

|   |
| - |

Report access = admin + guest\_admin

|   |
| - |

AUTH-07; REP-15 OPEN

|   |
| - |

TD-20

|   |
| - |

Audit viewer admin-only

|   |
| - |

AUD-08 OPEN

|   |
| - |

TD-21

|   |
| - |

No `department` table; text field

|   |
| - |

EMP-03

|   |
| - |

TD-22

|   |
| - |

Recommend overlap blocking pending+approved only; drafts/rejected/cancelled/withdrawn excluded

|   |
| - |

LV-OVR-03/04 unanswered

|   |
| - |

TD-23

|   |
| - |

First+second half same day allowed

|   |
| - |

Not specified as overlap

|   |
| - |

TD-24

|   |
| - |

MED-12: “exceeding two days” = `calculated_days > 2`

|   |
| - |

After weekend/holiday exclusion

|   |
| - |

TD-25

|   |
| - |

guest\_admin has no employee punches unless an employee row exists

|   |
| - |

Role vs profile
**Do not code TD-22 as policy** until LV-OVR-03/04 are signed; default in code may follow TD-22 only if product defers explicitly.

---

## **Open questions (implementation-critical)**

Only gaps that block a complete, unambiguous build:

1. **LV-OVR-03 / LV-OVR-04:** Which statuses participate in overlap? (Draft? Rejected/Cancelled/Withdrawn?)
2. **LV-APP-18:** What is the approval path when HR is absent? (No rule in the document.)
3. **§14 / Absent:** When there is no punch and no leave, is the day Absent, Missing Check-In, or something else? (Unauthorized absence is asked but not named in BRD statuses.)
4. **Missing Check-In / Check-Out exact triggers** (when, timezone already EST).
5. **AT-06/07/08:** Confirm duplicate punch and check-out-without-check-in as policy (recommended TD-12).
6. **NOTIF-12:** Clock times for unmarked attendance and missing-logout reminders.
7. **MED-06 / MED-10:** Max file size; retention.
8. **AT-COR-03:** Closed list of correction types; when a supporting doc is required.
9. **LV-DATE-07:** Numeric max-advance per leave type (defaults exist via TD-09).
10. **Who may cancel/withdraw an already approved leave?** (LV-STS-10 side effect confirmed; actor not.)
11. **AUD-08 / REP-14 / REP-16:** Audit visibility; report filters; inactive leave in reports.
12. **LV-BAL-08/09:** Only if the org later wants balances/probation/notice — currently no balance system.
13. **Full shift master data** for 18:30–02:30 vs TD-05 only.

Non-critical: MED-12 confirm TD-24; half-day 0.5 (TD-08); self-approve deny (TD-14).

---

## **Risks**

|   |
| - |

**Risk**
**Mitigation**

|   |
| - |

Building overlap/status derivation on unsigned predicates

|   |
| - |

Ship overlap as configurable status list; keep derived\_status nullable

|   |
| - |

Overnight shifts wrong `work_date`

|   |
| - |

TD-05 documented; validate with HR using a real roster

|   |
| - |

Medical data in Storage/logs

|   |
| - |

Private bucket, MED-09, no filename in info logs

|   |
| - |

Guest admin vs admin confusion

|   |
| - |

Enforce write 403 in tests

|   |
| - |

INT-03 correction spam

|   |
| - |

One SYSTEM correction per leave×date; unique SUBMITTED

|   |
| - |

Email notify vs TX

|   |
| - |

Persist in-app first; email async

|   |
| - |

Unique punch row vs Proposed AT-06

|   |
| - |

Treat unique as integrity; product confirms UX

---

## **Out of scope (this backend phase)**

- Application UI
- Implementation code, migrations, CI
- Leave balances / accruals
- Overtime
- Microsoft Teams / Slack (NOTIF-10)
- SSO / external IdP
- Sandwich filling weekends/holidays (CAL-07 forbids)
- Payroll, mobile apps, multi-company
- Inventing probation/notice leave eligibility (LV-BAL-08/09)

---

## **Approval checklist**

- HR agrees guest\_admin is read-only org access
- HR agrees Sick is medical leave (`is_medical`) or names the medical type
- HR answers open questions 1–4 or formally defers to TDs
- HR confirms admin direct attendance edit (already AT-COR-11 Confirmed)
- Dev agrees Express + Supabase split and RLS as backup
- This pack reviewed against [**Functional** ](https://markdowntoword.io/Functional%20_Requirements_and%20_business_requirements.md)[***Requirements***](https://markdowntoword.io/Functional%20_Requirements_and%20_business_requirements.md)[**and** ](https://markdowntoword.io/Functional%20_Requirements_and%20_business_requirements.md)[***business***](https://markdowntoword.io/Functional%20_Requirements_and%20_business_requirements.md)[**requirements.md**](https://markdowntoword.io/Functional%20_Requirements_and%20_business_requirements.md)

**Implementation must not start** until open questions 1–4 are answered or explicitly deferred to the TDs above