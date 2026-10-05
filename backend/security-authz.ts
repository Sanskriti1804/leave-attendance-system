/**
 * Isolated authorization checks. Creates its own department, people, and leave
 * rows, calls the API, then deletes those rows. Does not change application source.
 *
 * Run: npm run test:security
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import jwt from "jsonwebtoken";
import { createApp } from "./src/app.js";
import { env } from "./src/env.js";
import { prisma } from "./src/modules/shared/db/index.js";
import { ORGANISATION_SETTING_CATEGORY } from "./src/modules/shared/organisation-settings/repository.js";
import { hashPassword } from "./src/modules/shared/utils/security.js";
import { addCalendarDays, isoWeekday, todayInTimeZone } from "./src/modules/shared/utils/dates.js";

function addWorkingDays(civil: string, count: number, blocked: (date: string) => boolean): string {
  let date = civil;
  let added = 0;
  while (added < count) {
    date = addCalendarDays(date, 1);
    if (!blocked(date)) added += 1;
  }
  return date;
}

type Json = Record<string, unknown>;

let passed = 0;
let failed = 0;

function expect(name: string, actual: unknown, expected: unknown): void {
  try {
    assert.equal(actual, expected);
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✗ ${name}: ${(err as Error).message}`);
  }
}

async function request(
  base: string,
  method: string,
  pathName: string,
  options: { body?: unknown; token?: string } = {},
): Promise<{ status: number; json: Json; text: string }> {
  const headers: Record<string, string> = {};
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  let body: string | undefined;
  if (options.body !== undefined) {
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

async function login(base: string, email: string, password: string): Promise<string> {
  const res = await request(base, "POST", "/api/v1/auth/login", { body: { email, password } });
  assert.equal(res.status, 200, `login ${email}`);
  return String(res.json.accessToken);
}

function probeCors(nodeEnv: string, corsOrigin: string, requestOrigin: string): { status: number; allowOrigin: string | null } {
  const result = spawnSync("npx", ["tsx", "security-cors-probe.ts", requestOrigin], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: nodeEnv,
      CORS_ORIGIN: corsOrigin,
      JWT_SECRET: process.env.JWT_SECRET || env.jwtSecret,
      PASSWORD_PEPPER: process.env.PASSWORD_PEPPER || env.passwordPepper,
    },
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "cors probe failed");
  }
  const line = result.stdout.trim().split("\n").at(-1) ?? "{}";
  const parsed = JSON.parse(line) as { status: number; allowOrigin: string | null };
  return parsed;
}

async function run(): Promise<void> {
  const suffix = `sec${Date.now()}`;
  const password = "SecurityPass123!";
  const passwordHash = await hashPassword(password);
  const today = todayInTimeZone(env.appTimezone);
  const holidayRows = await prisma.holiday.findMany({ select: { holidayDate: true } });
  const holidayMonthDays = new Set(holidayRows.map((row) => row.holidayDate.toISOString().slice(5, 10)));
  const weeklyOff = await prisma.configurationSetting.findUnique({
    where: { settingCategory_settingKey: { settingCategory: ORGANISATION_SETTING_CATEGORY, settingKey: "weeklyOffDow" } },
  });
  const weeklyOffDow = new Set<number>(weeklyOff ? (JSON.parse(weeklyOff.settingValue) as number[]) : []);
  const day = addWorkingDays(today, 8, (date) => {
    const dow = isoWeekday(date);
    return dow === 6 || dow === 7 || weeklyOffDow.has(dow) || holidayMonthDays.has(date.slice(5));
  });

  const department = await prisma.department.create({ data: { departmentName: `Sec ${suffix}` } });
  const otherDept = await prisma.department.create({ data: { departmentName: `Sec2 ${suffix}` } });
  const leaveType = await prisma.leaveType.create({
    data: { name: `SecCasual ${suffix}`, requiresMedicalDocument: true },
  });

  const mk = (first: string, email: string, role: "employee" | "admin" | "guest_admin", departmentId: number) =>
    prisma.employee.create({
      data: {
        firstName: first,
        lastName: suffix,
        email,
        passwordHash,
        role,
        departmentId,
        status: "ACTIVE",
        sex: "male",
      },
    });

  const employeeA = await mk("A", `a.${suffix}@example.com`, "employee", department.departmentId);
  const employeeB = await mk("B", `b.${suffix}@example.com`, "employee", department.departmentId);
  const approver = await mk("Ap", `ap.${suffix}@example.com`, "employee", department.departmentId);
  const otherApprover = await mk("Oth", `oth.${suffix}@example.com`, "employee", otherDept.departmentId);
  const teamLead = await mk("Tl", `tl.${suffix}@example.com`, "employee", department.departmentId);
  const admin = await mk("Ad", `ad.${suffix}@example.com`, "admin", department.departmentId);
  const guest = await mk("Gu", `gu.${suffix}@example.com`, "guest_admin", department.departmentId);

  const priorLeads = await prisma.configurationSetting.findUnique({
    where: { settingCategory_settingKey: { settingCategory: ORGANISATION_SETTING_CATEGORY, settingKey: "teamLeadEmployeeIds" } },
  });
  const priorApprovers = await prisma.configurationSetting.findUnique({
    where: { settingCategory_settingKey: { settingCategory: ORGANISATION_SETTING_CATEGORY, settingKey: "teamApprovers" } },
  });
  const leads = priorLeads ? (JSON.parse(priorLeads.settingValue) as number[]) : [];
  const approvers = priorApprovers
    ? (JSON.parse(priorApprovers.settingValue) as { departmentId: number; employeeId: number }[])
    : [];
  const nextLeads = [...leads.filter((id) => id !== teamLead.employeeId), teamLead.employeeId];
  const nextApprovers = [
    ...approvers.filter((row) => row.departmentId !== department.departmentId),
    { departmentId: department.departmentId, employeeId: approver.employeeId },
  ];

  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.on("listening", () => resolve()));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const base = `http://127.0.0.1:${port}`;

  const createdLeaveIds: number[] = [];

  try {
    const leadJson = JSON.stringify(nextLeads);
    const approverJson = JSON.stringify(nextApprovers);
    if (leadJson.length > 100 || approverJson.length > 100) {
      throw new Error("Refusing to write organisation settings that exceed the 100-character column");
    }
    await prisma.configurationSetting.upsert({
      where: { settingCategory_settingKey: { settingCategory: ORGANISATION_SETTING_CATEGORY, settingKey: "teamLeadEmployeeIds" } },
      create: { settingCategory: ORGANISATION_SETTING_CATEGORY, settingKey: "teamLeadEmployeeIds", settingType: "json", settingValue: leadJson },
      update: { settingValue: leadJson },
    });
    await prisma.configurationSetting.upsert({
      where: { settingCategory_settingKey: { settingCategory: ORGANISATION_SETTING_CATEGORY, settingKey: "teamApprovers" } },
      create: { settingCategory: ORGANISATION_SETTING_CATEGORY, settingKey: "teamApprovers", settingType: "json", settingValue: approverJson },
      update: { settingValue: approverJson },
    });

    const tokenA = await login(base, employeeA.email, password);
    const tokenB = await login(base, employeeB.email, password);
    const tokenApprover = await login(base, approver.email, password);
    const tokenOther = await login(base, otherApprover.email, password);
    const tokenLead = await login(base, teamLead.email, password);
    const tokenAdmin = await login(base, admin.email, password);
    const tokenGuest = await login(base, guest.email, password);

    console.log("\n=== Tokens ===");
    const missing = await request(base, "GET", "/api/v1/auth/me");
    expect("missing token 401", missing.status, 401);
    const bad = await request(base, "GET", "/api/v1/auth/me", { token: "not-a-jwt" });
    expect("tampered token 401", bad.status, 401);
    const expired = jwt.sign(
      {
        employeeId: employeeA.employeeId,
        email: employeeA.email,
        role: "admin",
        departmentId: department.departmentId,
        status: "ACTIVE",
        exp: Math.floor(Date.now() / 1000) - 60,
      },
      env.jwtSecret,
      { algorithm: "HS256" },
    );
    const expiredRes = await request(base, "GET", "/api/v1/auth/me", { token: expired });
    expect("expired token 401", expiredRes.status, 401);
    const wrongKey = jwt.sign(
      { employeeId: employeeA.employeeId, email: employeeA.email, role: "admin", departmentId: department.departmentId, status: "ACTIVE" },
      "not-the-server-secret-not-the-server-secret",
      { algorithm: "HS256", expiresIn: "5m" },
    );
    const wrongKeyRes = await request(base, "GET", "/api/v1/auth/me", { token: wrongKey });
    expect("wrong signature 401", wrongKeyRes.status, 401);
    const escalated = jwt.sign(
      { employeeId: employeeA.employeeId, email: employeeA.email, role: "admin", departmentId: department.departmentId, status: "ACTIVE" },
      env.jwtSecret,
      { algorithm: "HS256", expiresIn: "5m" },
    );
    const escalatedRes = await request(base, "GET", "/api/v1/audit", { token: escalated });
    expect("role claim in token is ignored 403", escalatedRes.status, 403);

    console.log("\n=== Object access ===");
    const submitted = await request(base, "POST", "/api/v1/leaves", {
      token: tokenB,
      body: {
        leaveTypeId: leaveType.leaveTypeId,
        reason: "security check",
        employeeId: employeeA.employeeId,
        status: "APPROVED",
        role: "admin",
        reportingManagerEmployeeId: employeeA.employeeId,
        selectedDates: [{ date: day, session: "FULL_DAY" }],
      },
    });
    if (submitted.status !== 201) console.error(submitted.text);
    expect("employee submit own leave 201", submitted.status, 201);
    const leave = submitted.json;
    const leaveId = Number(leave.leaveId);
    if (Number.isInteger(leaveId)) createdLeaveIds.push(leaveId);
    expect("forged employeeId ignored", leave.employeeId, employeeB.employeeId);
    expect("forged status ignored", leave.status, "SUBMITTED");
    expect("assigned approver stored", leave.reportingManagerEmployeeId, approver.employeeId);

    const readOther = await request(base, "GET", `/api/v1/leaves/${leaveId}`, { token: tokenA });
    expect("employee A cannot read B leave 404", readOther.status, 404);
    const listForged = await request(base, "GET", `/api/v1/leaves?employeeId=${employeeB.employeeId}`, { token: tokenA });
    const listItems = (Array.isArray(listForged.json.items) ? listForged.json.items : []) as Json[];
    expect("employee A list ignores B employeeId", listItems.some((row) => row.leaveId === leaveId), false);
    const patchOther = await request(base, "PATCH", `/api/v1/leaves/${leaveId}`, {
      token: tokenA,
      body: { reason: "hijack" },
    });
    expect("employee A cannot edit B leave 404", patchOther.status, 404);
    const cancelOther = await request(base, "POST", `/api/v1/leaves/${leaveId}/cancel`, { token: tokenA });
    expect("employee A cannot cancel B leave 403", cancelOther.status, 403);
    const withdrawOther = await request(base, "POST", `/api/v1/leaves/${leaveId}/withdraw`, { token: tokenA });
    expect("employee A cannot withdraw B leave 404", withdrawOther.status, 404);

    const profile = await request(base, "GET", `/api/v1/employees/${employeeB.employeeId}`, { token: tokenA });
    expect("employee A cannot read B profile 403", profile.status, 403);
    const profileText = profile.text.toLowerCase();
    expect("profile error has no password hash", profileText.includes("passwordhash") || profileText.includes(passwordHash), false);

    const me = await request(base, "GET", "/api/v1/auth/me", { token: tokenA });
    expect("me has no password hash", me.text.toLowerCase().includes("passwordhash"), false);

    const rolePatch = await request(base, "PATCH", `/api/v1/employees/${employeeA.employeeId}`, {
      token: tokenA,
      body: { role: "admin" },
    });
    expect("employee cannot change own role 403", rolePatch.status, 403);

    console.log("\n=== Approver scope ===");
    const leadApprove = await request(base, "POST", `/api/v1/leaves/${leaveId}/manager-approve`, {
      token: tokenLead,
      body: { comment: "lead" },
    });
    expect("team lead cannot approve 403", leadApprove.status, 403);
    const otherApprove = await request(base, "POST", `/api/v1/leaves/${leaveId}/manager-approve`, {
      token: tokenOther,
      body: { comment: "other" },
    });
    expect("other approver cannot approve 403", otherApprove.status, 403);
    const empApprove = await request(base, "POST", `/api/v1/leaves/${leaveId}/manager-approve`, { token: tokenB, body: {} });
    expect("employee cannot manager-approve 403", empApprove.status, 403);
    const empHr = await request(base, "POST", `/api/v1/leaves/${leaveId}/approve`, { token: tokenB, body: {} });
    expect("employee cannot HR-approve 403", empHr.status, 403);
    const leadHr = await request(base, "POST", `/api/v1/leaves/${leaveId}/approve`, { token: tokenLead, body: {} });
    expect("team lead cannot HR-approve 403", leadHr.status, 403);
    const approverHr = await request(base, "POST", `/api/v1/leaves/${leaveId}/approve`, { token: tokenApprover, body: {} });
    expect("approver cannot HR-approve 403", approverHr.status, 403);

    const still = await prisma.leaveApplication.findUnique({ where: { leaveId } });
    expect("unauthorized calls left status SUBMITTED", still?.status, "SUBMITTED");

    const approverRead = await request(base, "GET", `/api/v1/leaves/${leaveId}`, { token: tokenApprover });
    expect("assigned approver can read 200", approverRead.status, 200);

    console.log("\n=== Admin and guest ===");
    const empAudit = await request(base, "GET", "/api/v1/audit", { token: tokenA });
    expect("employee audit 403", empAudit.status, 403);
    const guestAudit = await request(base, "GET", "/api/v1/audit", { token: tokenGuest });
    expect("guest audit 403", guestAudit.status, 403);
    const guestLeave = await request(base, "POST", "/api/v1/leaves", {
      token: tokenGuest,
      body: {
        leaveTypeId: leaveType.leaveTypeId,
        reason: "guest",
        selectedDates: [{ date: day, session: "FULL_DAY" }],
      },
    });
    expect("guest cannot submit leave 403", guestLeave.status, 403);
    const guestPatch = await request(base, "PATCH", `/api/v1/employees/${employeeA.employeeId}`, {
      token: tokenGuest,
      body: { role: "admin" },
    });
    expect("guest cannot patch employee 403", guestPatch.status, 403);
    const guestOrg = await request(base, "PATCH", "/api/v1/org-settings", {
      token: tokenGuest,
      body: { graceMinutes: 1 },
    });
    expect("guest cannot patch org settings 403", guestOrg.status, 403);
    const empEmployees = await request(base, "GET", "/api/v1/employees", { token: tokenA });
    expect("employee cannot list employees 403", empEmployees.status, 403);
    const adminAudit = await request(base, "GET", "/api/v1/audit?pageSize=1", { token: tokenAdmin });
    expect("admin audit 200", adminAudit.status, 200);

    console.log("\n=== Notifications and documents ===");
    const note = await prisma.notification.create({
      data: { userId: employeeB.employeeId, type: "TEST", title: "Sec", message: suffix },
    });
    const notesA = await request(base, "GET", "/api/v1/notifications", { token: tokenA });
    const noteItems = (Array.isArray(notesA.json.items) ? notesA.json.items : []) as Json[];
    expect("A cannot see B notification", noteItems.some((row) => row.notificationId === note.notificationId), false);
    const markA = await request(base, "POST", `/api/v1/notifications/${note.notificationId}/read`, { token: tokenA });
    expect("A cannot mark B notification 404", markA.status, 404);
    const markB = await request(base, "POST", `/api/v1/notifications/${note.notificationId}/read`, { token: tokenB });
    expect("B can mark own notification 200", markB.status, 200);

    const doc = await prisma.leaveDocument.create({
      data: {
        leaveId,
        fileName: `sec-${suffix}.pdf`,
        filePath: `missing/${suffix}.pdf`,
        fileType: "pdf",
        contentType: "application/pdf",
        fileSize: 10,
        uploadedBy: employeeB.employeeId,
      },
    });
    const docA = await request(base, "GET", `/api/v1/documents/${doc.documentId}`, { token: tokenA });
    expect("A cannot download B document 404", docA.status, 404);
    const docOwner = await request(base, "GET", `/api/v1/documents/${doc.documentId}`, { token: tokenB });
    expect("employee cannot download own medical document 403", docOwner.status, 403);

    console.log("\n=== CORS ===");
    if (env.nodeEnv !== "production") {
      const dev = await fetch(`${base}/health/health`, { headers: { origin: "https://evil.example" } });
      expect("development still answers health 200", dev.status, 200);
      expect("development still allows any browser origin", dev.headers.get("access-control-allow-origin"), "*");
    }
    const closed = probeCors("production", "", "https://evil.example");
    expect("production without CORS_ORIGIN health 200", closed.status, 200);
    expect("production without CORS_ORIGIN blocks browser origin", closed.allowOrigin, null);
    const noOrigin = probeCors("production", "", "");
    expect("production request without Origin still 200", noOrigin.status, 200);
    const allowed = probeCors("production", "https://app.example", "https://app.example");
    expect("production allows configured origin", allowed.allowOrigin, "https://app.example");
    const denied = probeCors("production", "https://app.example", "https://evil.example");
    expect("production denies other origin", denied.allowOrigin, null);
  } finally {
    server.close();
    if (priorLeads) {
      await prisma.configurationSetting.update({
        where: { settingCategory_settingKey: { settingCategory: ORGANISATION_SETTING_CATEGORY, settingKey: "teamLeadEmployeeIds" } },
        data: { settingValue: priorLeads.settingValue, settingType: priorLeads.settingType },
      });
    } else {
      await prisma.configurationSetting.deleteMany({
        where: { settingCategory: ORGANISATION_SETTING_CATEGORY, settingKey: "teamLeadEmployeeIds" },
      });
    }
    if (priorApprovers) {
      await prisma.configurationSetting.update({
        where: { settingCategory_settingKey: { settingCategory: ORGANISATION_SETTING_CATEGORY, settingKey: "teamApprovers" } },
        data: { settingValue: priorApprovers.settingValue, settingType: priorApprovers.settingType },
      });
    } else {
      await prisma.configurationSetting.deleteMany({
        where: { settingCategory: ORGANISATION_SETTING_CATEGORY, settingKey: "teamApprovers" },
      });
    }
    const leaveIds = createdLeaveIds.filter((id) => Number.isInteger(id));
    if (leaveIds.length > 0) {
      await prisma.leaveDocument.deleteMany({ where: { leaveId: { in: leaveIds } } });
      await prisma.leaveStatusHistory.deleteMany({ where: { leaveId: { in: leaveIds } } });
      await prisma.leaveDateSelection.deleteMany({ where: { leaveId: { in: leaveIds } } });
      await prisma.leaveApplication.deleteMany({ where: { leaveId: { in: leaveIds } } });
    }
    await prisma.notification.deleteMany({ where: { message: suffix } });
    await prisma.auditLog.deleteMany({
      where: { userId: { in: [employeeA.employeeId, employeeB.employeeId, approver.employeeId, admin.employeeId] } },
    });
    await prisma.employee.deleteMany({
      where: {
        employeeId: {
          in: [employeeA.employeeId, employeeB.employeeId, approver.employeeId, otherApprover.employeeId, teamLead.employeeId, admin.employeeId, guest.employeeId],
        },
      },
    });
    await prisma.leaveType.delete({ where: { leaveTypeId: leaveType.leaveTypeId } });
    await prisma.department.deleteMany({ where: { departmentId: { in: [department.departmentId, otherDept.departmentId] } } });
    await prisma.$disconnect();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

run().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exitCode = 1;
});
