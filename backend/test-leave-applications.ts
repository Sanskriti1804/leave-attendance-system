import assert from "node:assert/strict";
import { createApp } from "./src/app.js";
import { prisma } from "./src/modules/shared/db/index.js";
import { hashPassword } from "./src/modules/shared/utils/security.js";
import { addCalendarDays, todayInTimeZone } from "./src/modules/shared/utils/dates.js";
import { env } from "./src/env.js";

type Json = Record<string, unknown>;

async function request(
  base: string,
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; json: Json }> {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: Json = {};
  try {
    json = (await res.json()) as Json;
  } catch {
    json = {};
  }
  return { status: res.status, json };
}

async function run() {
  const suffix = `${Date.now()}`;
  const today = todayInTimeZone(env.appTimezone);
  const d0 = today;
  const d1 = addCalendarDays(today, 1);
  const d2 = addCalendarDays(today, 2);
  const d4 = addCalendarDays(today, 4);
  const d5 = addCalendarDays(today, 5);
  const d6 = addCalendarDays(today, 6);
  const d8 = addCalendarDays(today, 8);
  const tooFar = addCalendarDays(today, env.leaveMaxAdvanceDays + 1);

  const department = await prisma.department.create({
    data: { departmentName: `LeaveTest ${suffix}` },
  });
  const leaveType = await prisma.leaveType.create({
    data: { name: `Casual ${suffix}`, requiresMedicalDocument: false },
  });
  const holidayDate = fromMaybeHoliday(d5);
  const holiday = await prisma.holiday.create({
    data: { holidayName: `Test Holiday ${suffix}`, holidayDate: new Date(`${holidayDate}T00:00:00.000Z`) },
  });

  const password = "LeaveTestPass123!";
  const passwordHash = await hashPassword(password);

  const manager = await prisma.employee.create({
    data: {
      firstName: "Mgr",
      lastName: suffix,
      email: `mgr.${suffix}@example.com`,
      passwordHash,
      role: "employee",
      departmentId: department.departmentId,
      status: "ACTIVE",
    },
  });
  const employee = await prisma.employee.create({
    data: {
      firstName: "Emp",
      lastName: suffix,
      email: `emp.${suffix}@example.com`,
      passwordHash,
      role: "employee",
      departmentId: department.departmentId,
      managerId: manager.employeeId,
      status: "ACTIVE",
      sex: "male",
    },
  });
  const noManager = await prisma.employee.create({
    data: {
      firstName: "Solo",
      lastName: suffix,
      email: `solo.${suffix}@example.com`,
      passwordHash,
      role: "employee",
      departmentId: department.departmentId,
      status: "ACTIVE",
    },
  });
  const admin = await prisma.employee.create({
    data: {
      firstName: "Adm",
      lastName: suffix,
      email: `adm.${suffix}@example.com`,
      passwordHash,
      role: "admin",
      departmentId: department.departmentId,
      status: "ACTIVE",
    },
  });

  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.on("listening", () => resolve()));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const base = `http://127.0.0.1:${port}`;

  try {
    async function login(email: string): Promise<string> {
      const res = await request(base, "POST", "/api/v1/auth/login", { email, password });
      assert.equal(res.status, 200, `login failed for ${email}: ${JSON.stringify(res.json)}`);
      return String(res.json.accessToken);
    }

    const empToken = await login(employee.email);
    const mgrToken = await login(manager.email);
    const soloToken = await login(noManager.email);
    const adminToken = await login(admin.email);

    const leavePayload = {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "Personal work",
      selectedDates: [{ date: d1, session: "FULL_DAY" }],
    };

    console.log("[1] Normal employee submits leave");
    const submitted = await request(base, "POST", "/api/v1/leaves", leavePayload, empToken);
    assert.equal(submitted.status, 201, JSON.stringify(submitted.json));
    assert.equal(submitted.json.status, "SUBMITTED");
    assert.equal(submitted.json.managerApprovalStatus, "PENDING");
    const leaveId = Number(submitted.json.leaveId);

    console.log("[2] Manager approval is in-app");
    const mgrApproved = await request(base, "POST", `/api/v1/leaves/${leaveId}/manager-approve`, {}, mgrToken);
    assert.equal(mgrApproved.status, 200, JSON.stringify(mgrApproved.json));
    assert.equal(mgrApproved.json.status, "PENDING_HR_REVIEW");

    console.log("[3] No-manager employee goes to HR review");
    const solo = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "No manager path",
      selectedDates: [{ date: d2, session: "FULL_DAY" }],
    }, soloToken);
    assert.equal(solo.status, 201, JSON.stringify(solo.json));
    assert.equal(solo.json.status, "PENDING_HR_REVIEW");
    const soloLeaveId = Number(solo.json.leaveId);

    console.log("[4] HR/Admin self-leave auto-approved");
    const selfLeave = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "Admin own leave",
      selectedDates: [{ date: d0, session: "FULL_DAY" }],
    }, adminToken);
    assert.equal(selfLeave.status, 201, JSON.stringify(selfLeave.json));
    assert.equal(selfLeave.json.status, "APPROVED");
    const adminLeaveId = Number(selfLeave.json.leaveId);

    console.log("[5] Status history recorded");
    const history = await request(base, "GET", `/api/v1/leaves/${leaveId}/history`, undefined, empToken);
    assert.equal(history.status, 200, JSON.stringify(history.json));
    const transitions = (history.json.items as Array<{ oldStatus: string | null; newStatus: string }>).map(
      (row) => `${row.oldStatus ?? "null"}->${row.newStatus}`,
    );
    assert.ok(transitions.includes("DRAFT->SUBMITTED"));
    assert.ok(transitions.includes("SUBMITTED->PENDING_HR_REVIEW"));
    const adminHistory = await request(base, "GET", `/api/v1/leaves/${adminLeaveId}/history`, undefined, adminToken);
    const adminTransitions = (adminHistory.json.items as Array<{ oldStatus: string | null; newStatus: string }>).map(
      (row) => `${row.oldStatus ?? "null"}->${row.newStatus}`,
    );
    assert.ok(adminTransitions.includes("SUBMITTED->APPROVED"));

    console.log("[6-8] Blocking overlap for submitted / pending HR / approved");
    const submittedBlockDate = addCalendarDays(today, 3);
    const submittedOnly = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "submitted block",
      selectedDates: [{ date: submittedBlockDate, session: "FULL_DAY" }],
    }, empToken);
    assert.equal(submittedOnly.status, 201, JSON.stringify(submittedOnly.json));
    assert.equal(submittedOnly.json.status, "SUBMITTED");
    const overlapSubmitted = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "overlap submitted",
      selectedDates: [{ date: submittedBlockDate, session: "FULL_DAY" }],
    }, empToken);
    assert.equal(overlapSubmitted.status, 409);
    assert.equal((overlapSubmitted.json.error as Json).code, "LEAVE_OVERLAP");
    await request(base, "POST", `/api/v1/leaves/${Number(submittedOnly.json.leaveId)}/cancel`, {}, empToken);

    const overlapPending = await request(base, "POST", "/api/v1/leaves", leavePayload, empToken);
    assert.equal(overlapPending.status, 409);
    const overlapPendingHr = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "overlap pending hr",
      selectedDates: [{ date: d2, session: "FULL_DAY" }],
    }, soloToken);
    assert.equal(overlapPendingHr.status, 409);

    const overlapApproved = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "overlap approved",
      selectedDates: [{ date: d0, session: "FIRST_HALF" }],
    }, adminToken);
    assert.equal(overlapApproved.status, 409);

    await request(base, "POST", `/api/v1/leaves/${soloLeaveId}/reject`, { comment: "No" }, adminToken);

    console.log("[9] Rejected leave warns but allows");
    const afterReject = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "retry after reject",
      selectedDates: [{ date: d2, session: "FULL_DAY" }],
    }, soloToken);
    assert.equal(afterReject.status, 201, JSON.stringify(afterReject.json));
    assert.ok(Array.isArray(afterReject.json.warnings));
    const retryId = Number(afterReject.json.leaveId);
    await request(base, "POST", `/api/v1/leaves/${retryId}/cancel`, {}, soloToken);

    console.log("[10-11] Cancelled and withdrawn do not block");
    const toCancel = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "cancel me",
      selectedDates: [{ date: d5, session: "FULL_DAY" }],
    }, noManager ? soloToken : empToken);
    assert.equal(toCancel.status, 201, JSON.stringify(toCancel.json));
    const cancelId = Number(toCancel.json.leaveId);
    const cancelled = await request(base, "POST", `/api/v1/leaves/${cancelId}/cancel`, {}, soloToken);
    assert.equal(cancelled.status, 200, JSON.stringify(cancelled.json));
    const afterCancel = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "after cancel",
      selectedDates: [{ date: d5, session: "FULL_DAY" }],
    }, soloToken);
    assert.equal(afterCancel.status, 201, JSON.stringify(afterCancel.json));
    assert.equal(afterCancel.json.warnings, undefined);
    const withdrawId = Number(afterCancel.json.leaveId);
    const withdrawn = await request(base, "POST", `/api/v1/leaves/${withdrawId}/withdraw`, {}, soloToken);
    assert.equal(withdrawn.status, 200, JSON.stringify(withdrawn.json));
    const afterWithdraw = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "after withdraw",
      selectedDates: [{ date: d5, session: "FULL_DAY" }],
    }, soloToken);
    assert.equal(afterWithdraw.status, 201, JSON.stringify(afterWithdraw.json));
    await request(base, "POST", `/api/v1/leaves/${Number(afterWithdraw.json.leaveId)}/cancel`, {}, soloToken);

    const halfEmp = await prisma.employee.create({
      data: {
        firstName: "Half",
        lastName: suffix,
        email: `half.${suffix}@example.com`,
        passwordHash,
        role: "employee",
        departmentId: department.departmentId,
        status: "ACTIVE",
      },
    });
    const halfToken = await login(halfEmp.email);

    console.log("[12-15] Half-day overlap");
    const firstHalf = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "first half",
      selectedDates: [{ date: d1, session: "FIRST_HALF" }],
    }, halfToken);
    assert.equal(firstHalf.status, 201, JSON.stringify(firstHalf.json));
    const secondHalf = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "second half",
      selectedDates: [{ date: d1, session: "SECOND_HALF" }],
    }, halfToken);
    assert.equal(secondHalf.status, 201, JSON.stringify(secondHalf.json));
    const sameFirst = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "same first",
      selectedDates: [{ date: d1, session: "FIRST_HALF" }],
    }, halfToken);
    assert.equal(sameFirst.status, 409);
    const sameSecond = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "same second",
      selectedDates: [{ date: d1, session: "SECOND_HALF" }],
    }, halfToken);
    assert.equal(sameSecond.status, 409);
    const fullVsHalf = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "full vs half",
      selectedDates: [{ date: d1, session: "FULL_DAY" }],
    }, halfToken);
    assert.equal(fullVsHalf.status, 409);

    console.log("[16-18] Zigzag selected dates and numberOfDays");
    const zigzag = await request(base, "POST", "/api/v1/leaves/drafts", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "zigzag",
      selectedDates: [
        { date: d4, session: "FIRST_HALF" },
        { date: d6, session: "FULL_DAY" },
        { date: d8, session: "SECOND_HALF" },
      ],
    }, halfToken);
    assert.equal(zigzag.status, 201, JSON.stringify(zigzag.json));
    assert.equal(zigzag.json.numberOfDays, 2);
    assert.equal(zigzag.json.startDate, d4);
    assert.equal(zigzag.json.endDate, d8);
    const dates = zigzag.json.selectedDates as Array<{ date: string }>;
    assert.deepEqual(dates.map((row) => row.date), [d4, d6, d8]);

    console.log("[19] Leave beyond max advance is rejected");
    const far = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "too far",
      selectedDates: [{ date: tooFar, session: "FULL_DAY" }],
    }, halfToken);
    assert.equal(far.status, 422);
    assert.equal((far.json.error as Json).code, "TOO_FAR_AHEAD");

    console.log("[20] Holiday exclusion uses shared holidays");
    await prisma.configurationSetting.upsert({
      where: {
        settingCategory_settingKey: { settingCategory: "organisation", settingKey: "leaveCountExcludesHolidays" },
      },
      create: {
        settingCategory: "organisation",
        settingKey: "leaveCountExcludesHolidays",
        settingValue: "true",
        settingType: "boolean",
      },
      update: { settingValue: "true", settingType: "boolean" },
    });
    const holidayLeave = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: leaveType.leaveTypeId,
      reason: "holiday",
      selectedDates: [{ date: holidayDate, session: "FULL_DAY" }],
    }, halfToken);
    assert.equal(holidayLeave.status, 422, JSON.stringify(holidayLeave.json));

    await prisma.configurationSetting.upsert({
      where: {
        settingCategory_settingKey: { settingCategory: "organisation", settingKey: "leaveCountExcludesHolidays" },
      },
      create: {
        settingCategory: "organisation",
        settingKey: "leaveCountExcludesHolidays",
        settingValue: "false",
        settingType: "boolean",
      },
      update: { settingValue: "false" },
    });

    console.log("All leave application tests passed.");
  } finally {
    server.close();
    await prisma.leaveStatusHistory.deleteMany({
      where: { leave: { employee: { email: { contains: suffix } } } },
    });
    await prisma.leaveDateSelection.deleteMany({
      where: { leave: { employee: { email: { contains: suffix } } } },
    });
    await prisma.leaveApplication.deleteMany({
      where: { employee: { email: { contains: suffix } } },
    });
    await prisma.leaveType.delete({ where: { leaveTypeId: leaveType.leaveTypeId } }).catch(() => undefined);
    await prisma.holiday.delete({ where: { holidayId: holiday.holidayId } }).catch(() => undefined);
    await prisma.refreshToken.deleteMany({ where: { employee: { email: { contains: suffix } } } });
    await prisma.employee.deleteMany({ where: { email: { contains: suffix } } });
    await prisma.department.delete({ where: { departmentId: department.departmentId } }).catch(() => undefined);
    await prisma.$disconnect();
  }
}

function fromMaybeHoliday(civil: string): string {
  return civil;
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
