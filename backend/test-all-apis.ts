/**
 * HTTP coverage of every mounted Express route. Starts an in-process server
 * on an ephemeral port. Creates isolated seed rows (email suffix) and cleans them up.
 *
 * Requires DATABASE_URL (same as the live API). Does not change application source.
 *
 * Run: npm run test:apis
 */
import assert from "node:assert/strict";
import { createApp } from "./src/app.js";
import { env } from "./src/env.js";
import { prisma } from "./src/modules/shared/db/index.js";
import { hashPassword } from "./src/modules/shared/utils/security.js";
import { addCalendarDays, todayInTimeZone } from "./src/modules/shared/utils/dates.js";

type Json = Record<string, unknown>;

const PDF_BYTES = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

let passed = 0;
let failed = 0;

function errorCode(json: Json): string | undefined {
  const err = json.error as Json | undefined;
  return typeof err?.code === "string" ? err.code : undefined;
}

async function request(
  base: string,
  method: string,
  pathName: string,
  options: { body?: unknown; token?: string; raw?: boolean } = {},
): Promise<{ status: number; json: Json; text: string }> {
  const headers: Record<string, string> = {};
  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }
  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  const res = await fetch(`${base}${pathName}`, { method, headers, body });
  const text = await res.text();
  let json: Json = {};
  if (text) {
    try {
      json = JSON.parse(text) as Json;
    } catch {
      json = {};
    }
  }
  return { status: res.status, json, text };
}

function expect(
  name: string,
  actual: unknown,
  expected: unknown,
  extra?: string,
): void {
  try {
    assert.equal(actual, expected, extra);
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✗ ${name}: ${(err as Error).message}${extra ? ` ${extra}` : ""}`);
  }
}

async function run(): Promise<void> {
  const suffix = `${Date.now()}`;
  const password = "ApiSuitePass123!";
  const passwordHash = await hashPassword(password);
  const today = todayInTimeZone(env.appTimezone);
  const d1 = addCalendarDays(today, 1);
  const d2 = addCalendarDays(today, 2);
  const d3 = addCalendarDays(today, 3);
  const d4 = addCalendarDays(today, 4);
  const d6 = addCalendarDays(today, 6);
  const d7 = addCalendarDays(today, 7);
  const d10 = addCalendarDays(today, 10);
  const tooFar = addCalendarDays(today, env.leaveMaxAdvanceDays + 2);

  const department = await prisma.department.create({
    data: { departmentName: `ApiSuite ${suffix}` },
  });
  const casual = await prisma.leaveType.create({
    data: { name: `Casual ${suffix}`, requiresMedicalDocument: false },
  });
  const sick = await prisma.leaveType.create({
    data: {
      name: `Sick ${suffix}`,
      requiresMedicalDocument: true,
      policies: { create: { medicalDocumentAfterDays: 2 } },
    },
  });
  const maternity = await prisma.leaveType.create({
    data: { name: `Maternity ${suffix}`, allowedSex: "female" },
  });

  const manager = await prisma.employee.create({
    data: {
      firstName: "Mgr",
      lastName: suffix,
      email: `mgr.${suffix}@example.com`,
      passwordHash,
      role: "employee",
      departmentId: department.departmentId,
      status: "ACTIVE",
      sex: "male",
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
  const guest = await prisma.employee.create({
    data: {
      firstName: "Gst",
      lastName: suffix,
      email: `gst.${suffix}@example.com`,
      passwordHash,
      role: "guest_admin",
      departmentId: department.departmentId,
      status: "ACTIVE",
    },
  });
  const changer = await prisma.employee.create({
    data: {
      firstName: "Pwd",
      lastName: suffix,
      email: `pwd.${suffix}@example.com`,
      passwordHash,
      role: "employee",
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
    console.log("\n=== Health ===");
    const health = await request(base, "GET", "/health/health");
    expect("GET /health/health 200", health.status, 200);
    expect("health status ok", health.json.status, "ok");

    const missing = await request(base, "GET", "/api/v1/does-not-exist");
    expect("unknown route 404", missing.status, 404);
    expect("unknown route NOT_FOUND", errorCode(missing.json), "NOT_FOUND");

    console.log("\n=== Auth ===");
    const badEmail = await request(base, "POST", "/api/v1/auth/login", {
      body: { email: "not-an-email", password: "x" },
    });
    expect("login invalid email 422", badEmail.status, 422);

    const wrongPw = await request(base, "POST", "/api/v1/auth/login", {
      body: { email: admin.email, password: "WrongPassword123!" },
    });
    expect("login wrong password 401", wrongPw.status, 401);
    expect("login INVALID_CREDENTIALS", errorCode(wrongPw.json), "INVALID_CREDENTIALS");

    async function login(email: string, pw = password) {
      const res = await request(base, "POST", "/api/v1/auth/login", { body: { email, password: pw } });
      expect(`login ${email} 200`, res.status, 200, JSON.stringify(res.json));
      return {
        access: String(res.json.accessToken ?? ""),
        refresh: String(res.json.refreshToken ?? ""),
      };
    }

    const adminSess = await login(admin.email);
    const empSess = await login(employee.email);
    const mgrSess = await login(manager.email);
    const guestSess = await login(guest.email);
    const changerSess = await login(changer.email);

    const meNoAuth = await request(base, "GET", "/api/v1/auth/me");
    expect("GET /me no token 401", meNoAuth.status, 401);

    const meBad = await request(base, "GET", "/api/v1/auth/me", { token: "not-a-jwt" });
    expect("GET /me bad token 401", meBad.status, 401);

    const meAdmin = await request(base, "GET", "/api/v1/auth/me", { token: adminSess.access });
    expect("GET /me admin 200", meAdmin.status, 200);
    expect("GET /me email", meAdmin.json.email, admin.email);
    expect("GET /me has no passwordHash", meAdmin.json.passwordHash, undefined);

    const refreshed = await request(base, "POST", "/api/v1/auth/refresh", {
      body: { refreshToken: adminSess.refresh },
    });
    expect("refresh 200", refreshed.status, 200);
    expect("refresh rotates token", refreshed.json.refreshToken === adminSess.refresh, false);

    const reuseRefresh = await request(base, "POST", "/api/v1/auth/refresh", {
      body: { refreshToken: adminSess.refresh },
    });
    expect("old refresh rejected", reuseRefresh.status, 401);

    adminSess.access = String(refreshed.json.accessToken);
    adminSess.refresh = String(refreshed.json.refreshToken);

    const forgotUnknown = await request(base, "POST", "/api/v1/auth/forgot-password", {
      body: { email: `missing.${suffix}@example.com` },
    });
    expect("forgot unknown email 200", forgotUnknown.status, 200);

    const forgotOk = await request(base, "POST", "/api/v1/auth/forgot-password", {
      body: { email: changer.email },
    });
    expect("forgot known email 200", forgotOk.status, 200);

    const resetBad = await request(base, "POST", "/api/v1/auth/reset-password", {
      body: { token: "deadbeef", newPassword: "ResetPass123!" },
    });
    expect("reset invalid token 400", resetBad.status, 400);

    const changeBad = await request(base, "POST", "/api/v1/auth/change-password", {
      body: { currentPassword: "nope", newPassword: "NewComplex9!" },
      token: changerSess.access,
    });
    expect("change-password wrong current 400", changeBad.status, 400);

    const changeOk = await request(base, "POST", "/api/v1/auth/change-password", {
      body: { currentPassword: password, newPassword: "NewComplex9!" },
      token: changerSess.access,
    });
    expect("change-password 200", changeOk.status, 200);

    const loginNew = await request(base, "POST", "/api/v1/auth/login", {
      body: { email: changer.email, password: "NewComplex9!" },
    });
    expect("new password after change 200", loginNew.status, 200);

    const logout = await request(base, "POST", "/api/v1/auth/logout", {
      body: { refreshToken: String(loginNew.json.refreshToken) },
      token: String(loginNew.json.accessToken),
    });
    expect("logout 204", logout.status, 204);

    console.log("\n=== Departments ===");
    const deptUnauth = await request(base, "GET", "/api/v1/departments");
    expect("list departments no auth 401", deptUnauth.status, 401);

    const deptList = await request(base, "GET", "/api/v1/departments", { token: adminSess.access });
    expect("list departments admin 200", deptList.status, 200);
    expect("list departments has items", Array.isArray(deptList.json.items), true);

    const deptGuest = await request(base, "GET", "/api/v1/departments", { token: guestSess.access });
    expect("list departments guest 200", deptGuest.status, 200);

    const deptEmp = await request(base, "GET", "/api/v1/departments", { token: empSess.access });
    expect("list departments employee 200", deptEmp.status, 200);

    const createDeptGuest = await request(base, "POST", "/api/v1/departments", {
      body: { departmentName: `GuestDept ${suffix}` },
      token: guestSess.access,
    });
    expect("guest POST department 403", createDeptGuest.status, 403);

    const createDeptEmp = await request(base, "POST", "/api/v1/departments", {
      body: { departmentName: `EmpDept ${suffix}` },
      token: empSess.access,
    });
    expect("employee POST department 403", createDeptEmp.status, 403);

    const createDeptBad = await request(base, "POST", "/api/v1/departments", {
      body: { departmentName: "" },
      token: adminSess.access,
    });
    expect("POST department empty name 422", createDeptBad.status, 422);

    const createdDept = await request(base, "POST", "/api/v1/departments", {
      body: { departmentName: `QA ${suffix}` },
      token: adminSess.access,
    });
    expect("POST department 201", createdDept.status, 201);
    const extraDeptId = Number(createdDept.json.departmentId);

    const getDept = await request(base, "GET", `/api/v1/departments/${department.departmentId}`, {
      token: adminSess.access,
    });
    expect("GET department 200", getDept.status, 200);

    const getDeptMissing = await request(base, "GET", "/api/v1/departments/99999999", {
      token: adminSess.access,
    });
    expect("GET missing department 404", getDeptMissing.status, 404);

    const patchDept = await request(base, "PATCH", `/api/v1/departments/${extraDeptId}`, {
      body: { departmentName: `QA Lab ${suffix}` },
      token: adminSess.access,
    });
    expect("PATCH department 200", patchDept.status, 200);
    expect("PATCH department name", patchDept.json.departmentName, `QA Lab ${suffix}`);

    const patchDeptGuest = await request(base, "PATCH", `/api/v1/departments/${extraDeptId}`, {
      body: { departmentName: "Nope" },
      token: guestSess.access,
    });
    expect("guest PATCH department 403", patchDeptGuest.status, 403);

    console.log("\n=== Employees ===");
    const empListEmp = await request(base, "GET", "/api/v1/employees", { token: empSess.access });
    expect("employee GET /employees 403", empListEmp.status, 403);

    const empListAdmin = await request(base, "GET", "/api/v1/employees", { token: adminSess.access });
    expect("admin GET /employees 200", empListAdmin.status, 200);

    const empListGuest = await request(base, "GET", "/api/v1/employees", { token: guestSess.access });
    expect("guest GET /employees 200", empListGuest.status, 200);

    const empSelf = await request(base, "GET", `/api/v1/employees/${employee.employeeId}`, {
      token: empSess.access,
    });
    expect("employee GET self 200", empSelf.status, 200);

    const empOther = await request(base, "GET", `/api/v1/employees/${admin.employeeId}`, {
      token: empSess.access,
    });
    expect("employee GET other 403", empOther.status, 403);

    const createEmpGuest = await request(base, "POST", "/api/v1/employees", {
      body: {
        firstName: "X",
        email: `x.${suffix}@example.com`,
        password: "Employee2Pass123!",
        departmentId: department.departmentId,
        role: "employee",
      },
      token: guestSess.access,
    });
    expect("guest POST employee 403", createEmpGuest.status, 403);

    const createEmpBad = await request(base, "POST", "/api/v1/employees", {
      body: { firstName: "X", email: "bad", password: "short", departmentId: 1, role: "employee" },
      token: adminSess.access,
    });
    expect("POST employee invalid 422", createEmpBad.status, 422);

    const createdEmp = await request(base, "POST", "/api/v1/employees", {
      body: {
        firstName: "New",
        lastName: "Hire",
        email: `hire.${suffix}@example.com`,
        password: "Employee2Pass123!",
        departmentId: department.departmentId,
        role: "employee",
        sex: "female",
      },
      token: adminSess.access,
    });
    expect("POST employee 201", createdEmp.status, 201);
    const hireId = Number(createdEmp.json.employeeId);

    const patchEmp = await request(base, "PATCH", `/api/v1/employees/${hireId}`, {
      body: { lastName: "Updated" },
      token: adminSess.access,
    });
    expect("PATCH employee 200", patchEmp.status, 200);
    expect("PATCH lastName", patchEmp.json.lastName, "Updated");
    const hireLogin = await request(base, "POST", "/api/v1/auth/login", {
      body: { email: `hire.${suffix}@example.com`, password: "Employee2Pass123!" },
    });
    expect("login created hire 200", hireLogin.status, 200);
    const hireToken = String(hireLogin.json.accessToken ?? "");

    console.log("\n=== Org settings ===");
    const orgGet = await request(base, "GET", "/api/v1/org-settings", { token: empSess.access });
    expect("GET org-settings employee 200", orgGet.status, 200);
    expect("org-settings timezone present", typeof orgGet.json.timezone, "string");

    const orgPatchGuest = await request(base, "PATCH", "/api/v1/org-settings", {
      body: { graceMinutes: 5 },
      token: guestSess.access,
    });
    expect("guest PATCH org-settings 403", orgPatchGuest.status, 403);

    const orgPatchEmpty = await request(base, "PATCH", "/api/v1/org-settings", {
      body: {},
      token: adminSess.access,
    });
    expect("PATCH org-settings empty 422", orgPatchEmpty.status, 422);

    const orgPatch = await request(base, "PATCH", "/api/v1/org-settings", {
      body: { maxAdvanceDays: env.leaveMaxAdvanceDays },
      token: adminSess.access,
    });
    expect("PATCH org-settings admin 200", orgPatch.status, 200);

    console.log("\n=== Holidays ===");
    const holList = await request(base, "GET", `/api/v1/holidays?from=${d1}&to=${d10}`, {
      token: adminSess.access,
    });
    expect("GET holidays 200", holList.status, 200);

    const holRangeBad = await request(base, "GET", `/api/v1/holidays?from=${d10}&to=${d1}`, {
      token: adminSess.access,
    });
    expect("GET holidays from>to 422", holRangeBad.status, 422);

    const holGuestPost = await request(base, "POST", "/api/v1/holidays", {
      body: { date: d10, name: "Nope" },
      token: guestSess.access,
    });
    expect("guest POST holiday 403", holGuestPost.status, 403);

    const holCreate = await request(base, "POST", "/api/v1/holidays", {
      body: { date: d10, name: `Suite Holiday ${suffix}` },
      token: adminSess.access,
    });
    const holidayOk = holCreate.status === 201 || (holCreate.status === 409 && errorCode(holCreate.json) === "CONFLICT");
    expect("POST holiday 201 or 409", holidayOk, true, JSON.stringify(holCreate.json));
    const holidayId = holCreate.status === 201 ? Number(holCreate.json.holidayId) : 0;

    if (holidayId) {
      const holDup = await request(base, "POST", "/api/v1/holidays", {
        body: { date: d10, name: "Dup" },
        token: adminSess.access,
      });
      expect("duplicate holiday 409", holDup.status, 409);

      const holDelGuest = await request(base, "DELETE", `/api/v1/holidays/${holidayId}`, {
        token: guestSess.access,
      });
      expect("guest DELETE holiday 403", holDelGuest.status, 403);

      const holDel = await request(base, "DELETE", `/api/v1/holidays/${holidayId}`, {
        token: adminSess.access,
      });
      expect("DELETE holiday 204", holDel.status, 204);
    }

    console.log("\n=== Leave types ===");
    const ltList = await request(base, "GET", "/api/v1/leave-types", { token: empSess.access });
    expect("GET leave-types 200", ltList.status, 200);

    const ltGuestPost = await request(base, "POST", "/api/v1/leave-types", {
      body: { name: "X" },
      token: guestSess.access,
    });
    expect("guest POST leave-type 403", ltGuestPost.status, 403);

    const ltCreate = await request(base, "POST", "/api/v1/leave-types", {
      body: { name: `Temp ${suffix}`, description: "temporary" },
      token: adminSess.access,
    });
    expect("POST leave-type 201", ltCreate.status, 201);
    const tempTypeId = Number(ltCreate.json.leaveTypeId);

    const ltGet = await request(base, "GET", `/api/v1/leave-types/${casual.leaveTypeId}`, {
      token: empSess.access,
    });
    expect("GET leave-type 200", ltGet.status, 200);

    const ltMissing = await request(base, "GET", "/api/v1/leave-types/99999999", {
      token: adminSess.access,
    });
    expect("GET missing leave-type 404", ltMissing.status, 404);

    const ltPatch = await request(base, "PATCH", `/api/v1/leave-types/${tempTypeId}`, {
      body: { description: "updated" },
      token: adminSess.access,
    });
    expect("PATCH leave-type 200", ltPatch.status, 200);

    const ltDelete = await request(base, "DELETE", `/api/v1/leave-types/${tempTypeId}`, {
      token: adminSess.access,
    });
    expect("DELETE unused leave-type 204", ltDelete.status, 204);

    console.log("\n=== Leave policies ===");
    const polList = await request(base, "GET", `/api/v1/leave-policies?leaveTypeId=${sick.leaveTypeId}`, {
      token: guestSess.access,
    });
    expect("GET leave-policies guest 200", polList.status, 200);

    const polGuestPost = await request(base, "POST", "/api/v1/leave-policies", {
      body: { leaveTypeId: casual.leaveTypeId, medicalDocumentAfterDays: 2 },
      token: guestSess.access,
    });
    expect("guest POST policy 403", polGuestPost.status, 403);

    const polCreate = await request(base, "POST", "/api/v1/leave-policies", {
      body: { leaveTypeId: casual.leaveTypeId, medicalDocumentAfterDays: 5, includeWeekends: false },
      token: adminSess.access,
    });
    expect("POST leave-policy 201", polCreate.status, 201);
    const policyId = Number(polCreate.json.policyId);

    const polGet = await request(base, "GET", `/api/v1/leave-policies/${policyId}`, {
      token: adminSess.access,
    });
    expect("GET leave-policy 200", polGet.status, 200);

    const polPatch = await request(base, "PATCH", `/api/v1/leave-policies/${policyId}`, {
      body: { maxDays: 10 },
      token: adminSess.access,
    });
    expect("PATCH leave-policy 200", polPatch.status, 200);

    console.log("\n=== Leave applications ===");
    const leaveUnauth = await request(base, "POST", "/api/v1/leaves", {
      body: { leaveTypeId: casual.leaveTypeId, reason: "x", selectedDates: [{ date: d1, session: "FULL_DAY" }] },
    });
    expect("POST leave no auth 401", leaveUnauth.status, 401);

    const leaveInvalid = await request(base, "POST", "/api/v1/leaves", {
      body: { leaveTypeId: casual.leaveTypeId, reason: "", selectedDates: [] },
      token: empSess.access,
    });
    expect("POST leave invalid body 422", leaveInvalid.status, 422);

    const tooFarRes = await request(base, "POST", "/api/v1/leaves", {
      body: {
        leaveTypeId: casual.leaveTypeId,
        reason: "too far",
        selectedDates: [{ date: tooFar, session: "FULL_DAY" }],
      },
      token: empSess.access,
    });
    expect("leave too far 422", tooFarRes.status, 422);
    expect("TOO_FAR_AHEAD", errorCode(tooFarRes.json), "TOO_FAR_AHEAD");

    const ineligible = await request(base, "POST", "/api/v1/leaves", {
      body: {
        leaveTypeId: maternity.leaveTypeId,
        reason: "not eligible",
        selectedDates: [{ date: d1, session: "FULL_DAY" }],
      },
      token: empSess.access,
    });
    expect("male + maternity 422", ineligible.status, 422);
    expect("LEAVE_TYPE_NOT_ELIGIBLE", errorCode(ineligible.json), "LEAVE_TYPE_NOT_ELIGIBLE");

    const submitted = await request(base, "POST", "/api/v1/leaves", {
      body: {
        leaveTypeId: casual.leaveTypeId,
        reason: "Personal work",
        selectedDates: [{ date: d1, session: "FULL_DAY" }],
      },
      token: empSess.access,
    });
    expect("POST leave 201", submitted.status, 201, JSON.stringify(submitted.json));
    expect("status SUBMITTED", submitted.json.status, "SUBMITTED");
    const leaveId = Number(submitted.json.leaveId);

    const overlap = await request(base, "POST", "/api/v1/leaves", {
      body: {
        leaveTypeId: casual.leaveTypeId,
        reason: "overlap",
        selectedDates: [{ date: d1, session: "FULL_DAY" }],
      },
      token: empSess.access,
    });
    expect("overlap 409", overlap.status, 409);
    expect("LEAVE_OVERLAP", errorCode(overlap.json), "LEAVE_OVERLAP");

    const otherSees = await request(base, "GET", `/api/v1/leaves/${leaveId}`, { token: hireToken });
    expect("other employee GET leave 404", otherSees.status, 404);

    const ownerGet = await request(base, "GET", `/api/v1/leaves/${leaveId}`, { token: empSess.access });
    expect("owner GET leave 200", ownerGet.status, 200);

    const history = await request(base, "GET", `/api/v1/leaves/${leaveId}/history`, { token: empSess.access });
    expect("GET leave history 200", history.status, 200);
    expect("history items array", Array.isArray(history.json.items), true);

    const listOwn = await request(base, "GET", "/api/v1/leaves", { token: empSess.access });
    expect("employee list leaves 200", listOwn.status, 200);

    const mgrApprove = await request(base, "POST", `/api/v1/leaves/${leaveId}/manager-approve`, {
      body: {},
      token: mgrSess.access,
    });
    expect("manager-approve 200", mgrApprove.status, 200);
    expect("PENDING_HR_REVIEW", mgrApprove.json.status, "PENDING_HR_REVIEW");

    const selfApprove = await request(base, "POST", `/api/v1/leaves/${leaveId}/approve`, {
      body: { comment: "cannot" },
      token: empSess.access,
    });
    expect("employee HR approve 403", selfApprove.status, 403);

    const hrApprove = await request(base, "POST", `/api/v1/leaves/${leaveId}/approve`, {
      body: { comment: "OK" },
      token: adminSess.access,
    });
    expect("HR approve 200", hrApprove.status, 200);
    expect("APPROVED", hrApprove.json.status, "APPROVED");

    const adminOwn = await request(base, "POST", "/api/v1/leaves", {
      body: {
        leaveTypeId: casual.leaveTypeId,
        reason: "admin own",
        selectedDates: [{ date: d2, session: "FULL_DAY" }],
      },
      token: adminSess.access,
    });
    expect("admin self-submit 201", adminOwn.status, 201);
    expect("admin leave auto APPROVED", adminOwn.json.status, "APPROVED");

    const toReject = await request(base, "POST", "/api/v1/leaves", {
      body: {
        leaveTypeId: casual.leaveTypeId,
        reason: "reject me",
        selectedDates: [{ date: d3, session: "FULL_DAY" }],
      },
      token: empSess.access,
    });
    expect("leave for reject 201", toReject.status, 201);
    const rejectId = Number(toReject.json.leaveId);
    await request(base, "POST", `/api/v1/leaves/${rejectId}/manager-approve`, { body: {}, token: mgrSess.access });
    const rejected = await request(base, "POST", `/api/v1/leaves/${rejectId}/reject`, {
      body: { comment: "No" },
      token: adminSess.access,
    });
    expect("HR reject 200", rejected.status, 200);
    expect("REJECTED", rejected.json.status, "REJECTED");

    const toWithdraw = await request(base, "POST", "/api/v1/leaves", {
      body: {
        leaveTypeId: casual.leaveTypeId,
        reason: "withdraw me",
        selectedDates: [{ date: d4, session: "FULL_DAY" }],
      },
      token: empSess.access,
    });
    const withdrawId = Number(toWithdraw.json.leaveId);
    const withdrawn = await request(base, "POST", `/api/v1/leaves/${withdrawId}/withdraw`, {
      token: empSess.access,
    });
    expect("withdraw 200", withdrawn.status, 200);
    expect("WITHDRAWN", withdrawn.json.status, "WITHDRAWN");

    const draft = await request(base, "POST", "/api/v1/leaves/drafts", {
      body: {
        leaveTypeId: casual.leaveTypeId,
        reason: "draft",
        selectedDates: [{ date: d6, session: "FIRST_HALF" }],
      },
      token: empSess.access,
    });
    expect("POST drafts 201", draft.status, 201);
    expect("DRAFT", draft.json.status, "DRAFT");
    const draftId = Number(draft.json.leaveId);

    const patchDraft = await request(base, "PATCH", `/api/v1/leaves/${draftId}`, {
      body: { reason: "updated draft" },
      token: empSess.access,
    });
    expect("PATCH draft 200", patchDraft.status, 200);

    const submitDraft = await request(base, "POST", `/api/v1/leaves/${draftId}/submit`, {
      token: empSess.access,
    });
    expect("submit draft 200", submitDraft.status, 200);

    const mgrRejectLeave = await request(base, "POST", "/api/v1/leaves", {
      body: {
        leaveTypeId: casual.leaveTypeId,
        reason: "mgr reject",
        selectedDates: [{ date: d7, session: "SECOND_HALF" }],
      },
      token: empSess.access,
    });
    const mgrRejectId = Number(mgrRejectLeave.json.leaveId);
    const mgrRejected = await request(base, "POST", `/api/v1/leaves/${mgrRejectId}/manager-reject`, {
      body: { comment: "Busy week" },
      token: mgrSess.access,
    });
    expect("manager-reject 200", mgrRejected.status, 200);
    expect("manager reject -> REJECTED", mgrRejected.json.status, "REJECTED");

    const cancelLeave = await request(base, "POST", "/api/v1/leaves", {
      body: {
        leaveTypeId: casual.leaveTypeId,
        reason: "cancel",
        selectedDates: [{ date: addCalendarDays(today, 8), session: "FULL_DAY" }],
      },
      token: empSess.access,
    });
    const cancelId = Number(cancelLeave.json.leaveId);
    const cancelled = await request(base, "POST", `/api/v1/leaves/${cancelId}/cancel`, {
      token: empSess.access,
    });
    expect("cancel 200", cancelled.status, 200);
    expect("CANCELLED", cancelled.json.status, "CANCELLED");

    const guestMutateLeave = await request(base, "POST", "/api/v1/leaves", {
      body: {
        leaveTypeId: casual.leaveTypeId,
        reason: "guest",
        selectedDates: [{ date: d1, session: "FULL_DAY" }],
      },
      token: guestSess.access,
    });
    expect("guest POST leave 403", guestMutateLeave.status, 403);

    console.log("\n=== Documents ===");
    await prisma.configurationSetting.upsert({
      where: {
        settingCategory_settingKey: {
          settingCategory: "organisation",
          settingKey: "medicalDocOptional1To2Days",
        },
      },
      create: {
        settingCategory: "organisation",
        settingKey: "medicalDocOptional1To2Days",
        settingValue: "true",
        settingType: "boolean",
      },
      update: { settingValue: "true", settingType: "boolean" },
    });
    const medicalDraft = await request(base, "POST", "/api/v1/leaves/drafts", {
      body: {
        leaveTypeId: sick.leaveTypeId,
        reason: "flu",
        selectedDates: [
          { date: addCalendarDays(today, 9), session: "FULL_DAY" },
          { date: addCalendarDays(today, 11), session: "FULL_DAY" },
          { date: addCalendarDays(today, 12), session: "FULL_DAY" },
        ],
      },
      token: empSess.access,
    });
    expect("medical draft 201", medicalDraft.status, 201);
    const medicalDraftId = Number(medicalDraft.json.leaveId);

    const submitNoDoc = await request(base, "POST", `/api/v1/leaves/${medicalDraftId}/submit`, {
      token: empSess.access,
    });
    expect("submit medical without doc 422", submitNoDoc.status, 422);
    expect("MEDICAL_DOCUMENT_REQUIRED", errorCode(submitNoDoc.json), "MEDICAL_DOCUMENT_REQUIRED");

    const form = new FormData();
    form.set("leaveId", String(medicalDraftId));
    form.set("file", new Blob([PDF_BYTES], { type: "application/pdf" }), "note.pdf");
    const upload = await request(base, "POST", "/api/v1/documents", {
      body: form,
      token: empSess.access,
    });
    expect("POST document 201", upload.status, 201, JSON.stringify(upload.json));
    const documentId = Number(upload.json.documentId);

    const guestUpload = new FormData();
    guestUpload.set("leaveId", String(medicalDraftId));
    guestUpload.set("file", new Blob([PDF_BYTES], { type: "application/pdf" }), "note.pdf");
    const guestUp = await request(base, "POST", "/api/v1/documents", {
      body: guestUpload,
      token: guestSess.access,
    });
    expect("guest POST document 403", guestUp.status, 403);

    const empDl = await request(base, "GET", `/api/v1/documents/${documentId}`, { token: empSess.access });
    expect("employee GET medical document 403", empDl.status, 403);

    const adminDl = await request(base, "GET", `/api/v1/documents/${documentId}`, { token: adminSess.access });
    expect("admin GET medical document 200", adminDl.status, 200);

    const guestDl = await request(base, "GET", `/api/v1/documents/${documentId}`, { token: guestSess.access });
    expect("guest GET medical document 200", guestDl.status, 200);

    const submittedMed = await request(base, "POST", `/api/v1/leaves/${medicalDraftId}/submit`, {
      token: empSess.access,
    });
    expect("submit medical with doc 200", submittedMed.status, 200);

    const jsonNotMultipart = await request(base, "POST", "/api/v1/documents", {
      body: { leaveId: medicalDraftId },
      token: empSess.access,
    });
    expect("document JSON body 422", jsonNotMultipart.status, 422);
  } finally {
    server.close();
    await prisma.leaveDocument.deleteMany({
      where: { leave: { employee: { email: { contains: suffix } } } },
    });
    await prisma.leaveStatusHistory.deleteMany({
      where: { leave: { employee: { email: { contains: suffix } } } },
    });
    await prisma.leaveDateSelection.deleteMany({
      where: { leave: { employee: { email: { contains: suffix } } } },
    });
    await prisma.leaveApplication.deleteMany({
      where: { employee: { email: { contains: suffix } } },
    });
    await prisma.leavePolicy.deleteMany({
      where: { leaveType: { name: { contains: suffix } } },
    });
    await prisma.leaveType.deleteMany({ where: { name: { contains: suffix } } });
    await prisma.holiday.deleteMany({ where: { holidayName: { contains: suffix } } });
    await prisma.refreshToken.deleteMany({ where: { employee: { email: { contains: suffix } } } });
    await prisma.passwordResetToken.deleteMany({
      where: { employee: { email: { contains: suffix } } },
    });
    await prisma.employee.updateMany({
      where: { email: { contains: suffix } },
      data: { managerId: null },
    });
    await prisma.employee.deleteMany({ where: { email: { contains: suffix } } });
    await prisma.department.deleteMany({
      where: { departmentName: { contains: suffix } },
    });
    await prisma.$disconnect();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
