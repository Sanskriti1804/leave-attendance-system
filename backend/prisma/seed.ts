import prisma from "../src/modules/shared/db/prisma.js";
import { addCalendarDays, fromCivilDate, todayInTimeZone } from "../src/modules/shared/utils/dates.js";
import { hashPassword } from "../src/modules/shared/utils/security.js";

const ORG_CATEGORY = "organisation";

async function ensureDepartment(name: string) {
  let department = await prisma.department.findFirst({ where: { departmentName: name } });
  if (!department) {
    department = await prisma.department.create({ data: { departmentName: name, obsolete: false } });
    console.log(`Created Department: ${name} (ID: ${department.departmentId})`);
  }
  return department;
}

async function main() {
  console.log("Seeding database with initial department and dummy employees...");

  const engineeringDept = await ensureDepartment("Engineering");
  const hrDept = await ensureDepartment("Human Resources");
  const opsDept = await ensureDepartment("Operations");
  const productDept = await ensureDepartment("Product");

  const dummyEmployees = [
    {
      firstName: "Alice",
      lastName: "Stone",
      email: "alice.admin@example.com",
      password: "AdminPassword123!",
      role: "admin",
      departmentId: engineeringDept.departmentId,
      status: "ACTIVE",
      sex: "female",
      joiningDate: fromCivilDate("2024-01-15"),
    },
    {
      firstName: "Bob",
      lastName: "Smith",
      email: "bob.employee@example.com",
      password: "EmployeePassword123!",
      role: "employee",
      departmentId: engineeringDept.departmentId,
      status: "ACTIVE",
      sex: "male",
      joiningDate: fromCivilDate("2024-03-01"),
    },
    {
      firstName: "Charlie",
      lastName: "Vance",
      email: "charlie.guest@example.com",
      password: "GuestPassword123!",
      role: "guest_admin",
      departmentId: engineeringDept.departmentId,
      status: "ACTIVE",
      sex: "male",
      joiningDate: fromCivilDate("2024-06-01"),
    },
    {
      firstName: "Dana",
      lastName: "Reyes",
      email: "dana.employee@example.com",
      password: "EmployeePassword123!",
      role: "employee",
      departmentId: engineeringDept.departmentId,
      status: "ACTIVE",
      sex: "female",
      joiningDate: fromCivilDate("2024-08-12"),
    },
    {
      firstName: "Eve",
      lastName: "Patel",
      email: "eve.employee@example.com",
      password: "EmployeePassword123!",
      role: "employee",
      departmentId: engineeringDept.departmentId,
      status: "ACTIVE",
      sex: "female",
      joiningDate: fromCivilDate("2025-01-06"),
    },
    {
      firstName: "Farah",
      lastName: "Khan",
      email: "farah.hr@example.com",
      password: "EmployeePassword123!",
      role: "employee",
      departmentId: hrDept.departmentId,
      status: "ACTIVE",
      sex: "female",
      joiningDate: fromCivilDate("2023-11-02"),
    },
    {
      firstName: "Gio",
      lastName: "Marchetti",
      email: "gio.ops@example.com",
      password: "EmployeePassword123!",
      role: "employee",
      departmentId: opsDept.departmentId,
      status: "ACTIVE",
      sex: "male",
      joiningDate: fromCivilDate("2024-04-18"),
    },
    {
      firstName: "Hana",
      lastName: "Liu",
      email: "hana.product@example.com",
      password: "EmployeePassword123!",
      role: "employee",
      departmentId: productDept.departmentId,
      status: "ACTIVE",
      sex: "female",
      joiningDate: fromCivilDate("2024-09-09"),
    },
    {
      firstName: "Ibrahim",
      lastName: "Nair",
      email: "ibrahim.eng@example.com",
      password: "EmployeePassword123!",
      role: "employee",
      departmentId: engineeringDept.departmentId,
      status: "ACTIVE",
      sex: "male",
      joiningDate: fromCivilDate("2025-03-12"),
    },
    {
      firstName: "Jules",
      lastName: "Okeke",
      email: "jules.ops@example.com",
      password: "EmployeePassword123!",
      role: "employee",
      departmentId: opsDept.departmentId,
      status: "ACTIVE",
      sex: "unspecified",
      joiningDate: fromCivilDate("2025-05-20"),
    },
    {
      firstName: "Keiko",
      lastName: "Mori",
      email: "keiko.product@example.com",
      password: "EmployeePassword123!",
      role: "employee",
      departmentId: productDept.departmentId,
      status: "ACTIVE",
      sex: "female",
      joiningDate: fromCivilDate("2025-07-01"),
    },
    {
      firstName: "Leo",
      lastName: "Anders",
      email: "leo.hr@example.com",
      password: "EmployeePassword123!",
      role: "employee",
      departmentId: hrDept.departmentId,
      status: "ACTIVE",
      sex: "male",
      joiningDate: fromCivilDate("2023-06-14"),
    },
    {
      firstName: "Maya",
      lastName: "Singh",
      email: "maya.eng@example.com",
      password: "EmployeePassword123!",
      role: "employee",
      departmentId: engineeringDept.departmentId,
      status: "ACTIVE",
      sex: "female",
      joiningDate: fromCivilDate("2024-02-22"),
    },
    {
      firstName: "Noah",
      lastName: "Berg",
      email: "noah.ops@example.com",
      password: "EmployeePassword123!",
      role: "employee",
      departmentId: opsDept.departmentId,
      status: "INACTIVE",
      sex: "male",
      joiningDate: fromCivilDate("2022-10-03"),
    },
  ];

  for (const emp of dummyEmployees) {
    const existing = await prisma.employee.findUnique({
      where: { email: emp.email },
    });

    const passwordHash = await hashPassword(emp.password);

    if (!existing) {
      const created = await prisma.employee.create({
        data: {
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          passwordHash,
          role: emp.role,
          departmentId: emp.departmentId,
          status: emp.status,
          obsolete: false,
          sex: emp.sex,
          joiningDate: emp.joiningDate,
        },
      });
      console.log(`Created ${emp.role}: ${created.firstName} ${created.lastName} (${created.email})`);
    } else {
      await prisma.employee.update({
        where: { email: emp.email },
        data: {
          passwordHash,
          role: emp.role,
          status: emp.status,
          obsolete: false,
          sex: existing.sex ?? emp.sex,
          joiningDate: existing.joiningDate ?? emp.joiningDate,
        },
      });
      console.log(`Updated ${emp.role}: ${existing.firstName} ${existing.lastName} (${existing.email})`);
    }
  }

  const alice = await prisma.employee.findUniqueOrThrow({
    where: { email: "alice.admin@example.com" },
  });
  const bob = await prisma.employee.findUniqueOrThrow({
    where: { email: "bob.employee@example.com" },
  });
  const dana = await prisma.employee.findUniqueOrThrow({
    where: { email: "dana.employee@example.com" },
  });
  const eve = await prisma.employee.findUniqueOrThrow({
    where: { email: "eve.employee@example.com" },
  });

  for (const report of [bob, dana, eve]) {
    if (report.managerId !== alice.employeeId) {
      await prisma.employee.update({
        where: { employeeId: report.employeeId },
        data: { managerId: alice.employeeId },
      });
      console.log(`Set ${report.firstName}'s manager to Alice`);
    }
  }

  const leaveTypes = await ensureDefaultLeaveTypes();
  await ensureLeavePolicies(leaveTypes);
  await ensureOrganisationSettings();
  await ensureHolidays();
  await ensureSampleLeaves(bob.employeeId, alice.employeeId, leaveTypes, "bob");
  await ensureSampleLeaves(dana.employeeId, alice.employeeId, leaveTypes, "dana");
  await ensureAttendanceAndCorrections({
    bobId: bob.employeeId,
    danaId: dana.employeeId,
    reviewerId: alice.employeeId,
  });

  console.log("Seeding completed successfully.");
}

async function ensureDefaultLeaveTypes() {
  const defaults = [
    { name: "Casual", description: "Casual leave", requiresMedicalDocument: false, allowedSex: null as string | null },
    { name: "Sick", description: "Medical leave", requiresMedicalDocument: true, allowedSex: null as string | null },
    { name: "Emergency", description: "Emergency leave", requiresMedicalDocument: false, allowedSex: null as string | null },
    { name: "Planned", description: "Planned leave", requiresMedicalDocument: false, allowedSex: null as string | null },
  ];
  const rows = [];
  for (const leaveType of defaults) {
    let existing = await prisma.leaveType.findFirst({ where: { name: leaveType.name } });
    if (!existing) {
      existing = await prisma.leaveType.create({ data: leaveType });
      console.log(`Created LeaveType: ${leaveType.name}`);
    }
    rows.push(existing);
  }
  return rows;
}

async function ensureLeavePolicies(
  leaveTypes: { leaveTypeId: number; name: string; requiresMedicalDocument: boolean }[],
) {
  for (const leaveType of leaveTypes) {
    const existing = await prisma.leavePolicy.findFirst({
      where: { leaveTypeId: leaveType.leaveTypeId, obsolete: false },
    });
    if (existing) {
      continue;
    }
    await prisma.leavePolicy.create({
      data: {
        leaveTypeId: leaveType.leaveTypeId,
        medicalDocumentAfterDays: leaveType.requiresMedicalDocument ? 2 : null,
        includeWeekends: false,
        includeHolidays: false,
        maxDays: null,
        obsolete: false,
      },
    });
    console.log(`Created LeavePolicy for ${leaveType.name}`);
  }
}

async function ensureOrganisationSettings() {
  const settings: Array<{ key: string; value: string; type: string }> = [
    { key: "timezone", value: "America/New_York", type: "string" },
    { key: "workStart", value: "09:00", type: "string" },
    { key: "workEnd", value: "18:00", type: "string" },
    { key: "graceMinutes", value: "15", type: "number" },
    { key: "weeklyOffDow", value: JSON.stringify([6, 7]), type: "json" },
    { key: "leaveCountExcludesWeekends", value: "false", type: "boolean" },
    { key: "leaveCountExcludesHolidays", value: "false", type: "boolean" },
    { key: "medicalDocOptional1To2Days", value: "true", type: "boolean" },
    { key: "medicalDocExceedsDays", value: "2", type: "number" },
    { key: "maxAdvanceDays", value: "14", type: "number" },
  ];

  for (const setting of settings) {
    const existing = await prisma.configurationSetting.findUnique({
      where: {
        settingCategory_settingKey: {
          settingCategory: ORG_CATEGORY,
          settingKey: setting.key,
        },
      },
    });
    if (existing) {
      continue;
    }
    await prisma.configurationSetting.create({
      data: {
        settingCategory: ORG_CATEGORY,
        settingKey: setting.key,
        settingValue: setting.value,
        settingType: setting.type,
      },
    });
    console.log(`Created organisation setting: ${setting.key}`);
  }
}

async function ensureHolidays() {
  const holidays = [
    { holidayName: "New Year's Day", holidayDate: fromCivilDate("2026-01-01") },
    { holidayName: "Independence Day", holidayDate: fromCivilDate("2026-07-04") },
    { holidayName: "Labor Day", holidayDate: fromCivilDate("2026-09-07") },
    { holidayName: "Thanksgiving Day", holidayDate: fromCivilDate("2026-11-26") },
  ];
  for (const holiday of holidays) {
    const existing = await prisma.holiday.findUnique({
      where: { holidayDate: holiday.holidayDate },
    });
    if (existing) {
      continue;
    }
    await prisma.holiday.create({ data: holiday });
    console.log(`Created Holiday: ${holiday.holidayName}`);
  }
}

async function ensureSampleLeaves(
  employeeId: number,
  managerId: number,
  leaveTypes: { leaveTypeId: number; name: string }[],
  owner: "bob" | "dana",
) {
  const byName = (name: string) => leaveTypes.find((row) => row.name === name);
  const casual = byName("Casual");
  const planned = byName("Planned");
  const emergency = byName("Emergency");
  const sick = byName("Sick");
  if (!casual || !planned || !emergency || !sick) {
    return;
  }

  const today = todayInTimeZone("America/New_York");
  const samples =
    owner === "bob"
      ? [
          {
            reason: "[seed] Draft casual leave",
            leaveTypeId: casual.leaveTypeId,
            civilDate: addCalendarDays(today, 3),
            status: "DRAFT",
            durationType: "FULL_DAY",
            session: "FULL_DAY",
            unit: 1,
            reportingManagerEmployeeId: managerId,
          },
          {
            reason: "[seed] Submitted awaiting manager",
            leaveTypeId: casual.leaveTypeId,
            civilDate: addCalendarDays(today, 5),
            status: "SUBMITTED",
            durationType: "FULL_DAY",
            session: "FULL_DAY",
            unit: 1,
            reportingManagerEmployeeId: managerId,
            managerApprovalStatus: "PENDING",
          },
          {
            reason: "[seed] Pending HR review",
            leaveTypeId: planned.leaveTypeId,
            civilDate: addCalendarDays(today, 8),
            status: "PENDING_HR_REVIEW",
            durationType: "FULL_DAY",
            session: "FULL_DAY",
            unit: 1,
            reportingManagerEmployeeId: managerId,
            managerApprovalStatus: "APPROVED",
          },
          {
            reason: "[seed] Approved emergency leave",
            leaveTypeId: emergency.leaveTypeId,
            civilDate: addCalendarDays(today, 11),
            status: "APPROVED",
            durationType: "HALF_DAY",
            session: "FIRST_HALF",
            unit: 0.5,
            reportingManagerEmployeeId: managerId,
            managerApprovalStatus: "APPROVED",
          },
          {
            reason: "[seed] Withdrawn casual leave",
            leaveTypeId: casual.leaveTypeId,
            civilDate: addCalendarDays(today, 2),
            status: "WITHDRAWN",
            durationType: "FULL_DAY",
            session: "FULL_DAY",
            unit: 1,
            reportingManagerEmployeeId: managerId,
          },
        ]
      : [
          {
            reason: "[seed] Dana pending HR sick leave",
            leaveTypeId: sick.leaveTypeId,
            civilDate: addCalendarDays(today, 4),
            status: "PENDING_HR_REVIEW",
            durationType: "FULL_DAY",
            session: "FULL_DAY",
            unit: 1,
            reportingManagerEmployeeId: managerId,
            managerApprovalStatus: "APPROVED",
          },
          {
            reason: "[seed] Dana rejected planned leave",
            leaveTypeId: planned.leaveTypeId,
            civilDate: addCalendarDays(today, 6),
            status: "REJECTED",
            durationType: "FULL_DAY",
            session: "FULL_DAY",
            unit: 1,
            reportingManagerEmployeeId: managerId,
            managerApprovalStatus: "APPROVED",
          },
          {
            reason: "[seed] Dana approved casual leave",
            leaveTypeId: casual.leaveTypeId,
            civilDate: addCalendarDays(today, 9),
            status: "APPROVED",
            durationType: "FULL_DAY",
            session: "FULL_DAY",
            unit: 1,
            reportingManagerEmployeeId: managerId,
            managerApprovalStatus: "APPROVED",
          },
        ];

  for (const sample of samples) {
    const existing = await prisma.leaveApplication.findFirst({
      where: { employeeId, reason: sample.reason },
    });
    if (existing) {
      continue;
    }
    const leaveDate = fromCivilDate(sample.civilDate);
    await prisma.leaveApplication.create({
      data: {
        employeeId,
        leaveTypeId: sample.leaveTypeId,
        startDate: leaveDate,
        endDate: leaveDate,
        durationType: sample.durationType,
        halfDayType: sample.durationType === "HALF_DAY" ? sample.session : null,
        numberOfDays: sample.unit,
        reason: sample.reason,
        status: sample.status,
        reportingManagerEmployeeId: sample.reportingManagerEmployeeId,
        managerApprovalStatus: sample.managerApprovalStatus ?? null,
        dateSelections: {
          create: {
            leaveDate,
            session: sample.session,
            unit: sample.unit,
          },
        },
        statusHistory: {
          create: {
            changedById: employeeId,
            oldStatus: null,
            newStatus: sample.status,
            reason: "Seeded sample application",
          },
        },
      },
    });
    console.log(`Created leave application: ${sample.reason}`);
  }
}

function utcStamp(civilDate: string, hours: number, minutes: number): Date {
  return new Date(`${civilDate}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00.000Z`);
}

async function ensureAttendanceRow(params: {
  employeeId: number;
  civilDate: string;
  status: string;
  checkIn?: Date | null;
  checkOut?: Date | null;
  lateMinutes?: number;
}) {
  const attendanceDate = fromCivilDate(params.civilDate);
  const existing = await prisma.attendance.findUnique({
    where: {
      employeeId_attendanceDate: {
        employeeId: params.employeeId,
        attendanceDate,
      },
    },
  });
  if (existing) {
    return existing;
  }
  const created = await prisma.attendance.create({
    data: {
      employeeId: params.employeeId,
      attendanceDate,
      status: params.status,
      checkIn: params.checkIn ?? null,
      checkOut: params.checkOut ?? null,
      lateMinutes: params.lateMinutes ?? 0,
    },
  });
  console.log(`Created attendance ${params.status} for employee ${params.employeeId} on ${params.civilDate}`);
  return created;
}

async function ensureCorrection(params: {
  employeeId: number;
  attendanceId: number;
  civilDate: string;
  correctionType: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  correctLoginTime?: Date | null;
  correctLogoutTime?: Date | null;
  reviewedBy?: number | null;
  hrComments?: string | null;
}) {
  const existing = await prisma.attendanceCorrection.findFirst({
    where: { employeeId: params.employeeId, reason: params.reason },
  });
  if (existing) {
    return existing;
  }
  const created = await prisma.attendanceCorrection.create({
    data: {
      employeeId: params.employeeId,
      attendanceId: params.attendanceId,
      correctionDate: fromCivilDate(params.civilDate),
      correctionType: params.correctionType,
      correctLoginTime: params.correctLoginTime ?? null,
      correctLogoutTime: params.correctLogoutTime ?? null,
      reason: params.reason,
      status: params.status,
      reviewedBy: params.status === "PENDING" ? null : (params.reviewedBy ?? null),
      reviewedAt: params.status === "PENDING" ? null : new Date(),
      hrComments: params.hrComments ?? null,
    },
  });
  console.log(`Created attendance correction: ${params.reason}`);
  return created;
}

async function ensureAttendanceAndCorrections(params: {
  bobId: number;
  danaId: number;
  reviewerId: number;
}) {
  const today = todayInTimeZone("America/New_York");
  const bobPresentDate = addCalendarDays(today, -2);
  const bobMissedOutDate = addCalendarDays(today, -3);
  const danaPresentDate = addCalendarDays(today, -2);
  const danaAbsentDate = addCalendarDays(today, -4);

  const bobPresent = await ensureAttendanceRow({
    employeeId: params.bobId,
    civilDate: bobPresentDate,
    status: "Present",
    checkIn: utcStamp(bobPresentDate, 13, 5),
    checkOut: utcStamp(bobPresentDate, 22, 2),
    lateMinutes: 0,
  });
  const bobMissedOut = await ensureAttendanceRow({
    employeeId: params.bobId,
    civilDate: bobMissedOutDate,
    status: "Missing Check-Out",
    checkIn: utcStamp(bobMissedOutDate, 13, 12),
    checkOut: null,
    lateMinutes: 0,
  });
  const danaPresent = await ensureAttendanceRow({
    employeeId: params.danaId,
    civilDate: danaPresentDate,
    status: "Present",
    checkIn: utcStamp(danaPresentDate, 13, 40),
    checkOut: utcStamp(danaPresentDate, 22, 5),
    lateMinutes: 25,
  });
  await ensureAttendanceRow({
    employeeId: params.danaId,
    civilDate: danaAbsentDate,
    status: "Absent",
  });

  await ensureCorrection({
    employeeId: params.bobId,
    attendanceId: bobMissedOut.attendanceId,
    civilDate: bobMissedOutDate,
    correctionType: "Missed check-out",
    reason: "[seed] Forgot to punch out after client call",
    status: "PENDING",
    correctLoginTime: utcStamp(bobMissedOutDate, 13, 12),
    correctLogoutTime: utcStamp(bobMissedOutDate, 22, 0),
  });
  await ensureCorrection({
    employeeId: params.bobId,
    attendanceId: bobPresent.attendanceId,
    civilDate: bobPresentDate,
    correctionType: "Wrong check-in time",
    reason: "[seed] Badge reader recorded the wrong check-in",
    status: "APPROVED",
    correctLoginTime: utcStamp(bobPresentDate, 13, 0),
    correctLogoutTime: utcStamp(bobPresentDate, 22, 2),
    reviewedBy: params.reviewerId,
    hrComments: "Approved — badge logs match 09:00 ET.",
  });
  await ensureCorrection({
    employeeId: params.danaId,
    attendanceId: danaPresent.attendanceId,
    civilDate: danaPresentDate,
    correctionType: "Late arrival",
    reason: "[seed] Train delay, request to waive late minutes",
    status: "REJECTED",
    correctLoginTime: utcStamp(danaPresentDate, 13, 5),
    correctLogoutTime: utcStamp(danaPresentDate, 22, 5),
    reviewedBy: params.reviewerId,
    hrComments: "Rejected — commute delay is not an allowed correction.",
  });
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
