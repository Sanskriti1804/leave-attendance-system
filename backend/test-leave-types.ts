import assert from "node:assert/strict";
import { createApp } from "./src/app.js";
import { env } from "./src/env.js";
import { prisma } from "./src/modules/shared/db/index.js";
import { hashPassword } from "./src/modules/shared/utils/security.js";
import { addCalendarDays, todayInTimeZone } from "./src/modules/shared/utils/dates.js";

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

async function run() {
  const suffix = `${Date.now()}`;
  const today = todayInTimeZone(env.appTimezone);
  const d1 = addCalendarDays(today, 1);

  const department = await prisma.department.create({
    data: { departmentName: `TypeTest ${suffix}` },
  });
  const password = "TypeTestPass123!";
  const passwordHash = await hashPassword(password);

  const male = await prisma.employee.create({
    data: {
      firstName: "Male",
      lastName: suffix,
      email: `male.${suffix}@example.com`,
      passwordHash,
      role: "employee",
      departmentId: department.departmentId,
      status: "ACTIVE",
      sex: "male",
    },
  });
  const female = await prisma.employee.create({
    data: {
      firstName: "Fem",
      lastName: suffix,
      email: `fem.${suffix}@example.com`,
      passwordHash,
      role: "employee",
      departmentId: department.departmentId,
      status: "ACTIVE",
      sex: "female",
    },
  });
  const unspecified = await prisma.employee.create({
    data: {
      firstName: "Uns",
      lastName: suffix,
      email: `uns.${suffix}@example.com`,
      passwordHash,
      role: "employee",
      departmentId: department.departmentId,
      status: "ACTIVE",
      sex: "unspecified",
    },
  });
  const noSex = await prisma.employee.create({
    data: {
      firstName: "Nil",
      lastName: suffix,
      email: `nil.${suffix}@example.com`,
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
      email: `typeadm.${suffix}@example.com`,
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
      email: `typegst.${suffix}@example.com`,
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

  let maternityId: number | undefined;
  let casualId: number | undefined;
  let unusedId: number | undefined;

  try {
    async function login(email: string): Promise<string> {
      const res = await request(base, "POST", "/api/v1/auth/login", { email, password });
      assert.equal(res.status, 200, JSON.stringify(res.json));
      return String(res.json.accessToken);
    }

    const maleToken = await login(male.email);
    const femaleToken = await login(female.email);
    const unsToken = await login(unspecified.email);
    const nilToken = await login(noSex.email);
    const adminToken = await login(admin.email);
    const guestToken = await login(guest.email);

    console.log("[1] Leave type create/update follows admin permissions");
    const guestCreate = await request(base, "POST", "/api/v1/leave-types", { name: `X ${suffix}` }, guestToken);
    assert.equal(guestCreate.status, 403);
    const empCreate = await request(base, "POST", "/api/v1/leave-types", { name: `X ${suffix}` }, maleToken);
    assert.equal(empCreate.status, 403);

    const maternity = await request(base, "POST", "/api/v1/leave-types", {
      name: `Maternity ${suffix}`,
      description: "Restricted",
      allowedSex: "female",
    }, adminToken);
    assert.equal(maternity.status, 201, JSON.stringify(maternity.json));
    maternityId = Number(maternity.json.leaveTypeId);

    const invalidSex = await request(base, "POST", "/api/v1/leave-types", {
      name: `Bad ${suffix}`,
      allowedSex: "other",
    }, adminToken);
    assert.equal(invalidSex.status, 422);

    const updated = await request(base, "PATCH", `/api/v1/leave-types/${maternityId}`, {
      description: "Maternity leave",
    }, adminToken);
    assert.equal(updated.status, 200, JSON.stringify(updated.json));
    assert.equal(updated.json.description, "Maternity leave");
    assert.equal(updated.json.allowedSex, "female");

    const guestPatch = await request(base, "PATCH", `/api/v1/leave-types/${maternityId}`, { name: "Nope" }, guestToken);
    assert.equal(guestPatch.status, 403);

    console.log("[2] allowedSex is stored correctly");
    const fetched = await request(base, "GET", `/api/v1/leave-types/${maternityId}`, undefined, femaleToken);
    assert.equal(fetched.status, 200);
    assert.equal(fetched.json.allowedSex, "female");

    const casual = await request(base, "POST", "/api/v1/leave-types", {
      name: `Casual ${suffix}`,
      allowedSex: null,
    }, adminToken);
    assert.equal(casual.status, 201, JSON.stringify(casual.json));
    casualId = Number(casual.json.leaveTypeId);
    assert.equal(casual.json.allowedSex, null);

    const unused = await request(base, "POST", "/api/v1/leave-types", {
      name: `Unused ${suffix}`,
      allowedSex: "unspecified",
    }, adminToken);
    assert.equal(unused.status, 201);
    unusedId = Number(unused.json.leaveTypeId);
    assert.equal(unused.json.allowedSex, "unspecified");

    const listed = await request(base, "GET", "/api/v1/leave-types", undefined, maleToken);
    assert.equal(listed.status, 200);
    const items = listed.json.items as Array<{ leaveTypeId: number }>;
    assert.ok(items.some((row) => row.leaveTypeId === maternityId));

    console.log("[3] Employee sex is stored correctly");
    const createdEmp = await request(base, "POST", "/api/v1/employees", {
      firstName: "Pat",
      lastName: suffix,
      email: `pat.${suffix}@example.com`,
      password,
      departmentId: department.departmentId,
      role: "employee",
      sex: "female",
    }, adminToken);
    assert.equal(createdEmp.status, 201, JSON.stringify(createdEmp.json));
    assert.equal(createdEmp.json.sex, "female");
    const invalidEmpSex = await request(base, "POST", "/api/v1/employees", {
      firstName: "Bad",
      lastName: suffix,
      email: `badsex.${suffix}@example.com`,
      password,
      departmentId: department.departmentId,
      role: "employee",
      sex: "unknown",
    }, adminToken);
    assert.equal(invalidEmpSex.status, 422);

    console.log("[4] Nullable and unspecified sex work");
    const gotNil = await request(base, "GET", `/api/v1/employees/${noSex.employeeId}`, undefined, adminToken);
    assert.equal(gotNil.json.sex, null);
    const gotUns = await request(base, "GET", `/api/v1/employees/${unspecified.employeeId}`, undefined, adminToken);
    assert.equal(gotUns.json.sex, "unspecified");
    const clearSex = await request(base, "PATCH", `/api/v1/employees/${male.employeeId}`, { sex: null }, adminToken);
    assert.equal(clearSex.status, 200);
    assert.equal(clearSex.json.sex, null);
    await request(base, "PATCH", `/api/v1/employees/${male.employeeId}`, { sex: "male" }, adminToken);

    const leavePayload = (leaveTypeId: number) => ({
      leaveTypeId,
      reason: "eligibility check",
      selectedDates: [{ date: d1, session: "FULL_DAY" }],
    });

    console.log("[5] Restricted leave type rejects ineligible employee");
    const maleMaternity = await request(base, "POST", "/api/v1/leaves", leavePayload(maternityId), maleToken);
    assert.equal(maleMaternity.status, 422);
    assert.equal((maleMaternity.json.error as Json).code, "LEAVE_TYPE_NOT_ELIGIBLE");
    const unsMaternity = await request(base, "POST", "/api/v1/leaves", leavePayload(maternityId), unsToken);
    assert.equal(unsMaternity.status, 422);
    const nilMaternity = await request(base, "POST", "/api/v1/leaves", leavePayload(maternityId), nilToken);
    assert.equal(nilMaternity.status, 422);

    console.log("[6] Restricted leave type accepts eligible employee");
    const femaleMaternity = await request(base, "POST", "/api/v1/leaves", leavePayload(maternityId), femaleToken);
    assert.equal(femaleMaternity.status, 201, JSON.stringify(femaleMaternity.json));

    console.log("[7] Leave type without allowedSex remains unrestricted");
    const maleCasual = await request(base, "POST", "/api/v1/leaves", leavePayload(casualId), maleToken);
    assert.equal(maleCasual.status, 201, JSON.stringify(maleCasual.json));
    const unsCasual = await request(base, "POST", "/api/v1/leaves/drafts", leavePayload(casualId), unsToken);
    assert.equal(unsCasual.status, 201, JSON.stringify(unsCasual.json));
    const nilCasual = await request(base, "POST", "/api/v1/leaves/drafts", {
      leaveTypeId: casualId,
      reason: "null sex casual",
      selectedDates: [{ date: addCalendarDays(today, 2), session: "FULL_DAY" }],
    }, nilToken);
    assert.equal(nilCasual.status, 201, JSON.stringify(nilCasual.json));
    const unspecifiedType = await request(base, "POST", "/api/v1/leaves/drafts", {
      leaveTypeId: casualId,
      reason: "unspecified restriction means open",
      selectedDates: [{ date: addCalendarDays(today, 3), session: "FULL_DAY" }],
    }, maleToken);
    assert.equal(unspecifiedType.status, 201, JSON.stringify(unspecifiedType.json));

    console.log("[8-9] Eligibility is enforced on the server during application");
    const otherDate = addCalendarDays(today, 4);
    const ineligiblePayload = {
      leaveTypeId: maternityId,
      reason: "eligibility check",
      selectedDates: [{ date: otherDate, session: "FULL_DAY" }],
    };
    const draftIneligible = await request(base, "POST", "/api/v1/leaves/drafts", ineligiblePayload, maleToken);
    assert.equal(draftIneligible.status, 422);
    const submitIneligible = await request(base, "POST", "/api/v1/leaves", ineligiblePayload, maleToken);
    assert.equal(submitIneligible.status, 422);

    console.log("[10] Unused leave type can be deleted; in-use type is deactivated");
    const deleted = await request(base, "DELETE", `/api/v1/leave-types/${unusedId}`, undefined, adminToken);
    assert.equal(deleted.status, 204);
    unusedId = undefined;
    const deactivated = await request(base, "DELETE", `/api/v1/leave-types/${maternityId}`, undefined, adminToken);
    assert.equal(deactivated.status, 200);
    assert.equal(deactivated.json.obsolete, true);
    const hidden = await request(base, "GET", "/api/v1/leave-types", undefined, maleToken);
    const visibleIds = (hidden.json.items as Array<{ leaveTypeId: number }>).map((row) => row.leaveTypeId);
    assert.equal(visibleIds.includes(maternityId), false);

    console.log("All leave type tests passed.");
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
    const typeIds = [maternityId, casualId, unusedId].filter((id): id is number => id !== undefined);
    if (typeIds.length > 0) {
      await prisma.leaveType.deleteMany({ where: { leaveTypeId: { in: typeIds } } });
    }
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
