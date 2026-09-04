import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createApp } from "./src/app.js";
import { env } from "./src/env.js";
import { prisma } from "./src/modules/shared/db/index.js";
import { hashPassword } from "./src/modules/shared/utils/security.js";
import { addCalendarDays, isoWeekday, todayInTimeZone } from "./src/modules/shared/utils/dates.js";

type Json = Record<string, unknown>;

async function request(
  base: string,
  method: string,
  pathName: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; json: Json }> {
  const res = await fetch(`${base}${pathName}`, {
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

function nextWeekend(today: string, maxAdvance: number): string {
  for (let offset = 0; offset <= maxAdvance; offset += 1) {
    const civil = addCalendarDays(today, offset);
    const dow = isoWeekday(civil);
    if (dow === 6 || dow === 7) {
      return civil;
    }
  }
  throw new Error("No weekend date inside the advance window");
}

async function run() {
  const suffix = `${Date.now()}`;
  const today = todayInTimeZone(env.appTimezone);
  const day5 = addCalendarDays(today, 5);
  const day3 = addCalendarDays(today, 3);
  const day1 = addCalendarDays(today, 1);
  const day2 = addCalendarDays(today, 2);

  const department = await prisma.department.create({
    data: { departmentName: `PolicyTest ${suffix}` },
  });
  const casual = await prisma.leaveType.create({
    data: { name: `Casual ${suffix}`, requiresMedicalDocument: false },
  });
  const medical = await prisma.leaveType.create({
    data: { name: `Medical ${suffix}`, requiresMedicalDocument: true },
  });

  const password = "PolicyTestPass123!";
  const passwordHash = await hashPassword(password);
  const employee = await prisma.employee.create({
    data: {
      firstName: "Pol",
      lastName: suffix,
      email: `pol.${suffix}@example.com`,
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
      email: `poladm.${suffix}@example.com`,
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
      email: `polgst.${suffix}@example.com`,
      passwordHash,
      role: "guest_admin",
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

  const previousMaxAdvance = await prisma.configurationSetting.findUnique({
    where: { settingCategory_settingKey: { settingCategory: "organisation", settingKey: "maxAdvanceDays" } },
  });

  try {
    async function login(email: string): Promise<string> {
      const res = await request(base, "POST", "/api/v1/auth/login", { email, password });
      assert.equal(res.status, 200, JSON.stringify(res.json));
      return String(res.json.accessToken);
    }

    const empToken = await login(employee.email);
    const adminToken = await login(admin.email);
    const guestToken = await login(guest.email);

    console.log("[1] Default maximum advance period is 14 days");
    assert.equal(env.leaveMaxAdvanceDays, 14);
    const settings = await request(base, "GET", "/api/v1/org-settings", undefined, adminToken);
    assert.equal(settings.status, 200, JSON.stringify(settings.json));
    assert.equal(settings.json.maxAdvanceDays, 14);

    console.log("[2] Previous 4-day/half-week default is no longer used");
    const day5Leave = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: casual.leaveTypeId,
      reason: "five days ahead",
      selectedDates: [{ date: day5, session: "FULL_DAY" }],
    }, empToken);
    assert.equal(day5Leave.status, 201, JSON.stringify(day5Leave.json));
    await request(base, "POST", `/api/v1/leaves/${Number(day5Leave.json.leaveId)}/cancel`, {}, empToken);

    console.log("[3] Leave validation consumes configured max advance");
    const patchAdvance = await request(base, "PATCH", "/api/v1/org-settings", { maxAdvanceDays: 3 }, adminToken);
    assert.equal(patchAdvance.status, 200);
    assert.equal(patchAdvance.json.maxAdvanceDays, 3);
    const blockedByConfig = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: casual.leaveTypeId,
      reason: "beyond configured window",
      selectedDates: [{ date: day5, session: "FULL_DAY" }],
    }, empToken);
    assert.equal(blockedByConfig.status, 422);
    assert.equal((blockedByConfig.json.error as Json).code, "TOO_FAR_AHEAD");
    const withinConfig = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: casual.leaveTypeId,
      reason: "inside configured window",
      selectedDates: [{ date: day3, session: "FULL_DAY" }],
    }, empToken);
    assert.equal(withinConfig.status, 201, JSON.stringify(withinConfig.json));
    await request(base, "POST", `/api/v1/leaves/${Number(withinConfig.json.leaveId)}/cancel`, {}, empToken);
    await request(base, "PATCH", "/api/v1/org-settings", { maxAdvanceDays: 14 }, adminToken);

    console.log("[4] Medical document threshold uses LeavePolicy.medicalDocumentAfterDays");
    const createdPolicy = await request(base, "POST", "/api/v1/leave-policies", {
      leaveTypeId: medical.leaveTypeId,
      medicalDocumentAfterDays: 2,
      includeWeekends: true,
      includeHolidays: true,
    }, adminToken);
    assert.equal(createdPolicy.status, 201, JSON.stringify(createdPolicy.json));
    assert.equal(createdPolicy.json.medicalDocumentAfterDays, 2);
    const guestWrite = await request(base, "POST", "/api/v1/leave-policies", {
      leaveTypeId: casual.leaveTypeId,
    }, guestToken);
    assert.equal(guestWrite.status, 403);

    const overThreshold = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: medical.leaveTypeId,
      reason: "three medical days",
      selectedDates: [
        { date: day1, session: "FULL_DAY" },
        { date: day2, session: "FULL_DAY" },
        { date: day3, session: "FULL_DAY" },
      ],
    }, empToken);
    assert.equal(overThreshold.status, 422);
    assert.equal((overThreshold.json.error as Json).code, "MEDICAL_DOCUMENT_REQUIRED");

    console.log("[5] 1-2 day medical leave follows organisation setting");
    await request(base, "PATCH", "/api/v1/org-settings", { medicalDocOptional1To2Days: true }, adminToken);
    const optionalShort = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: medical.leaveTypeId,
      reason: "short optional",
      selectedDates: [{ date: day1, session: "FULL_DAY" }],
    }, empToken);
    assert.equal(optionalShort.status, 201, JSON.stringify(optionalShort.json));
    await request(base, "POST", `/api/v1/leaves/${Number(optionalShort.json.leaveId)}/cancel`, {}, empToken);

    await request(base, "PATCH", "/api/v1/org-settings", { medicalDocOptional1To2Days: false }, adminToken);
    const requiredShort = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: medical.leaveTypeId,
      reason: "short required",
      selectedDates: [{ date: day1, session: "FULL_DAY" }],
    }, empToken);
    assert.equal(requiredShort.status, 422);
    assert.equal((requiredShort.json.error as Json).code, "MEDICAL_DOCUMENT_REQUIRED");
    await request(base, "PATCH", "/api/v1/org-settings", { medicalDocOptional1To2Days: true }, adminToken);

    console.log("[6] Existing weekend settings still work");
    await request(base, "PATCH", "/api/v1/org-settings", { leaveCountExcludesWeekends: true }, adminToken);
    const weekend = nextWeekend(today, 14);
    const weekendLeave = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: casual.leaveTypeId,
      reason: "weekend",
      selectedDates: [{ date: weekend, session: "FULL_DAY" }],
    }, empToken);
    assert.equal(weekendLeave.status, 422, JSON.stringify(weekendLeave.json));
    await request(base, "PATCH", "/api/v1/org-settings", { leaveCountExcludesWeekends: false }, adminToken);

    console.log("[7-8] Holiday exclusion uses shared holidays module (owner-provided dates)");
    const holidayDate = addCalendarDays(today, 6);
    const holiday = await request(base, "POST", "/api/v1/holidays", {
      date: holidayDate,
      name: `Owner holiday ${suffix}`,
    }, adminToken);
    assert.equal(holiday.status, 201, JSON.stringify(holiday.json));
    await request(base, "PATCH", "/api/v1/org-settings", { leaveCountExcludesHolidays: true }, adminToken);
    const holidayLeave = await request(base, "POST", "/api/v1/leaves", {
      leaveTypeId: casual.leaveTypeId,
      reason: "holiday",
      selectedDates: [{ date: holidayDate, session: "FULL_DAY" }],
    }, empToken);
    assert.equal(holidayLeave.status, 422, JSON.stringify(holidayLeave.json));
    await request(base, "PATCH", "/api/v1/org-settings", { leaveCountExcludesHolidays: false }, adminToken);
    await request(base, "DELETE", `/api/v1/holidays/${Number(holiday.json.holidayId)}`, undefined, adminToken);

    console.log("[9] No Florida/external holiday logic in leave policies or holidays");
    const policyDir = path.resolve("src/modules/leave-management/leave-policies");
    const holidayDir = path.resolve("src/modules/shared/holidays");
    const policyFiles = ["service.ts", "repository.ts", "route.ts", "controller.ts", "validation.ts"];
    const holidayFiles = ["service.ts", "repository.ts", "route.ts", "controller.ts", "validation.ts"];
    for (const file of policyFiles) {
      const text = await readFile(path.join(policyDir, file), "utf8");
      assert.equal(/Florida|googleapis\.com|festival dates/i.test(text), false, file);
    }
    for (const file of holidayFiles) {
      const text = await readFile(path.join(holidayDir, file), "utf8");
      assert.equal(/Florida|googleapis\.com|festival dates/i.test(text), false, file);
    }

    console.log("[10] APP_TIMEZONE is loaded through env.ts");
    assert.equal(env.appTimezone, process.env.APP_TIMEZONE ?? "America/New_York");
    assert.equal(settings.json.timezone, env.appTimezone);

    console.log("All leave policy tests passed.");
  } finally {
    server.close();
    if (previousMaxAdvance) {
      await prisma.configurationSetting.update({
        where: { settingCategory_settingKey: { settingCategory: "organisation", settingKey: "maxAdvanceDays" } },
        data: { settingValue: previousMaxAdvance.settingValue },
      });
    } else {
      await prisma.configurationSetting.deleteMany({
        where: { settingCategory: "organisation", settingKey: "maxAdvanceDays" },
      });
    }
    await prisma.configurationSetting.upsert({
      where: {
        settingCategory_settingKey: { settingCategory: "organisation", settingKey: "medicalDocOptional1To2Days" },
      },
      create: {
        settingCategory: "organisation",
        settingKey: "medicalDocOptional1To2Days",
        settingValue: "true",
        settingType: "boolean",
      },
      update: { settingValue: "true" },
    });
    await prisma.configurationSetting.upsert({
      where: {
        settingCategory_settingKey: { settingCategory: "organisation", settingKey: "leaveCountExcludesWeekends" },
      },
      create: {
        settingCategory: "organisation",
        settingKey: "leaveCountExcludesWeekends",
        settingValue: "false",
        settingType: "boolean",
      },
      update: { settingValue: "false" },
    });
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
      where: { leaveTypeId: { in: [casual.leaveTypeId, medical.leaveTypeId] } },
    });
    await prisma.leaveType.deleteMany({
      where: { leaveTypeId: { in: [casual.leaveTypeId, medical.leaveTypeId] } },
    });
    await prisma.refreshToken.deleteMany({ where: { employee: { email: { contains: suffix } } } });
    await prisma.employee.deleteMany({ where: { email: { contains: suffix } } });
    await prisma.department.delete({ where: { departmentId: department.departmentId } }).catch(() => undefined);
    await prisma.$disconnect();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
