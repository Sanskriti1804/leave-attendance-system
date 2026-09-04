import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { createApp } from "./src/app.js";
import { env } from "./src/env.js";
import { prisma } from "./src/modules/shared/db/index.js";
import { hashPassword } from "./src/modules/shared/utils/security.js";
import { addCalendarDays, todayInTimeZone } from "./src/modules/shared/utils/dates.js";

type Json = Record<string, unknown>;

const PDF_BYTES = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const JPEG_BYTES = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);
const PNG_BYTES = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082",
  "hex",
);

async function jsonRequest(
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

async function uploadRequest(
  base: string,
  token: string,
  leaveId: number,
  file: { name: string; type: string; bytes: Buffer },
): Promise<{ status: number; json: Json }> {
  const form = new FormData();
  form.set("leaveId", String(leaveId));
  form.set("file", new Blob([file.bytes], { type: file.type }), file.name);
  const res = await fetch(`${base}/api/v1/documents`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: form,
  });
  let json: Json = {};
  try {
    json = (await res.json()) as Json;
  } catch {
    json = {};
  }
  return { status: res.status, json };
}

async function setOrgFlag(key: string, value: boolean): Promise<void> {
  await prisma.configurationSetting.upsert({
    where: { settingCategory_settingKey: { settingCategory: "organisation", settingKey: key } },
    create: {
      settingCategory: "organisation",
      settingKey: key,
      settingValue: String(value),
      settingType: "boolean",
    },
    update: { settingValue: String(value), settingType: "boolean" },
  });
}

async function run() {
  const suffix = `${Date.now()}`;
  const today = todayInTimeZone(env.appTimezone);
  const d0 = today;
  const d1 = addCalendarDays(today, 1);
  const d2 = addCalendarDays(today, 2);
  const d3 = addCalendarDays(today, 3);
  const d5 = addCalendarDays(today, 5);
  const d7 = addCalendarDays(today, 7);

  const department = await prisma.department.create({
    data: { departmentName: `DocTest ${suffix}` },
  });
  const casual = await prisma.leaveType.create({
    data: { name: `Casual ${suffix}`, requiresMedicalDocument: false },
  });
  const medical = await prisma.leaveType.create({
    data: {
      name: `Medical ${suffix}`,
      requiresMedicalDocument: true,
      policies: { create: { medicalDocumentAfterDays: 2 } },
    },
  });

  const password = "DocTestPass123!";
  const passwordHash = await hashPassword(password);
  const employee = await prisma.employee.create({
    data: {
      firstName: "Doc",
      lastName: suffix,
      email: `doc.${suffix}@example.com`,
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
      email: `docadm.${suffix}@example.com`,
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
      email: `docgst.${suffix}@example.com`,
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

  try {
    async function login(email: string): Promise<string> {
      const res = await jsonRequest(base, "POST", "/api/v1/auth/login", { email, password });
      assert.equal(res.status, 200, JSON.stringify(res.json));
      return String(res.json.accessToken);
    }

    const empToken = await login(employee.email);
    const adminToken = await login(admin.email);
    const guestToken = await login(guest.email);

    await setOrgFlag("medicalDocOptional1To2Days", true);

    const casualDraft = await jsonRequest(base, "POST", "/api/v1/leaves/drafts", {
      leaveTypeId: casual.leaveTypeId,
      reason: "docs",
      selectedDates: [{ date: d0, session: "FULL_DAY" }],
    }, empToken);
    assert.equal(casualDraft.status, 201, JSON.stringify(casualDraft.json));
    const casualDraftId = Number(casualDraft.json.leaveId);

    console.log("[1] Valid PDF upload");
    const pdf = await uploadRequest(base, empToken, casualDraftId, {
      name: "note.pdf",
      type: "application/pdf",
      bytes: PDF_BYTES,
    });
    assert.equal(pdf.status, 201, JSON.stringify(pdf.json));
    assert.equal(pdf.json.contentType, "application/pdf");
    assert.equal(pdf.json.fileSize, PDF_BYTES.length);
    assert.equal(pdf.json.fileType, "pdf");

    console.log("[2] Valid JPG/JPEG upload");
    const jpg = await uploadRequest(base, empToken, casualDraftId, {
      name: "scan.jpg",
      type: "image/jpeg",
      bytes: JPEG_BYTES,
    });
    assert.equal(jpg.status, 201, JSON.stringify(jpg.json));
    assert.equal(jpg.json.contentType, "image/jpeg");
    assert.equal(jpg.json.fileSize, JPEG_BYTES.length);
    const jpeg = await uploadRequest(base, empToken, casualDraftId, {
      name: "scan.jpeg",
      type: "image/jpeg",
      bytes: JPEG_BYTES,
    });
    assert.equal(jpeg.status, 201, JSON.stringify(jpeg.json));

    console.log("[3] Valid PNG upload");
    const png = await uploadRequest(base, empToken, casualDraftId, {
      name: "scan.png",
      type: "image/png",
      bytes: PNG_BYTES,
    });
    assert.equal(png.status, 201, JSON.stringify(png.json));
    assert.equal(png.json.contentType, "image/png");
    assert.equal(png.json.fileSize, PNG_BYTES.length);

    console.log("[4] Unsupported file type rejected");
    const txt = await uploadRequest(base, empToken, casualDraftId, {
      name: "note.txt",
      type: "text/plain",
      bytes: Buffer.from("hello"),
    });
    assert.equal(txt.status, 422);
    assert.equal((txt.json.error as Json).code, "UNSUPPORTED_MEDIA_TYPE");

    console.log("[5] Empty file rejected");
    const empty = await uploadRequest(base, empToken, casualDraftId, {
      name: "empty.pdf",
      type: "application/pdf",
      bytes: Buffer.alloc(0),
    });
    assert.equal(empty.status, 422);

    console.log("[6-7] File size and MIME stored correctly");
    assert.equal(typeof pdf.json.fileSize, "number");
    assert.ok(Number(pdf.json.fileSize) > 0);
    assert.equal(pdf.json.contentType, "application/pdf");

    console.log("[8] Medical leave >2 days without document blocked");
    const medicalDraft = await jsonRequest(base, "POST", "/api/v1/leaves/drafts", {
      leaveTypeId: medical.leaveTypeId,
      reason: "illness",
      selectedDates: [
        { date: d1, session: "FULL_DAY" },
        { date: d2, session: "FULL_DAY" },
        { date: d3, session: "FULL_DAY" },
      ],
    }, empToken);
    assert.equal(medicalDraft.status, 201, JSON.stringify(medicalDraft.json));
    assert.equal(medicalDraft.json.numberOfDays, 3);
    const medicalDraftId = Number(medicalDraft.json.leaveId);
    const blocked = await jsonRequest(base, "POST", `/api/v1/leaves/${medicalDraftId}/submit`, undefined, empToken);
    assert.equal(blocked.status, 422, JSON.stringify(blocked.json));
    assert.equal((blocked.json.error as Json).code, "MEDICAL_DOCUMENT_REQUIRED");

    const directSubmit = await jsonRequest(base, "POST", "/api/v1/leaves", {
      leaveTypeId: medical.leaveTypeId,
      reason: "illness direct",
      selectedDates: [
        { date: d5, session: "FULL_DAY" },
        { date: addCalendarDays(today, 6), session: "FULL_DAY" },
        { date: d7, session: "FULL_DAY" },
      ],
    }, empToken);
    assert.equal(directSubmit.status, 422);
    assert.equal((directSubmit.json.error as Json).code, "MEDICAL_DOCUMENT_REQUIRED");

    console.log("[9] Medical leave >2 days with valid document allowed");
    const uploadedMed = await uploadRequest(base, empToken, medicalDraftId, {
      name: "certificate.pdf",
      type: "application/pdf",
      bytes: PDF_BYTES,
    });
    assert.equal(uploadedMed.status, 201, JSON.stringify(uploadedMed.json));
    const submittedMed = await jsonRequest(
      base,
      "POST",
      `/api/v1/leaves/${medicalDraftId}/submit`,
      undefined,
      empToken,
    );
    assert.equal(submittedMed.status, 200, JSON.stringify(submittedMed.json));

    const empDownload = await fetch(`${base}/api/v1/documents/${Number(uploadedMed.json.documentId)}`, {
      headers: { authorization: `Bearer ${empToken}` },
    });
    assert.equal(empDownload.status, 403);

    const adminDownload = await fetch(`${base}/api/v1/documents/${Number(uploadedMed.json.documentId)}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminDownload.status, 200);
    assert.equal(adminDownload.headers.get("content-type"), "application/pdf");

    console.log("[10] Medical leave 1-2 days follows organisation setting");
    const shortDraft = await jsonRequest(base, "POST", "/api/v1/leaves/drafts", {
      leaveTypeId: medical.leaveTypeId,
      reason: "short illness",
      selectedDates: [{ date: d0, session: "FULL_DAY" }],
    }, adminToken);
    assert.equal(shortDraft.status, 201, JSON.stringify(shortDraft.json));
    const shortOptional = await jsonRequest(
      base,
      "POST",
      `/api/v1/leaves/${Number(shortDraft.json.leaveId)}/submit`,
      undefined,
      adminToken,
    );
    assert.equal(shortOptional.status, 200, JSON.stringify(shortOptional.json));

    await setOrgFlag("medicalDocOptional1To2Days", false);
    const shortRequiredDraft = await jsonRequest(base, "POST", "/api/v1/leaves/drafts", {
      leaveTypeId: medical.leaveTypeId,
      reason: "short required",
      selectedDates: [{ date: addCalendarDays(today, 4), session: "FULL_DAY" }],
    }, empToken);
    assert.equal(shortRequiredDraft.status, 201, JSON.stringify(shortRequiredDraft.json));
    const shortBlocked = await jsonRequest(
      base,
      "POST",
      `/api/v1/leaves/${Number(shortRequiredDraft.json.leaveId)}/submit`,
      undefined,
      empToken,
    );
    assert.equal(shortBlocked.status, 422);
    assert.equal((shortBlocked.json.error as Json).code, "MEDICAL_DOCUMENT_REQUIRED");
    await setOrgFlag("medicalDocOptional1To2Days", true);

    console.log("[11] Non-medical leave does not require a medical document");
    const casualSubmit = await jsonRequest(base, "POST", "/api/v1/leaves", {
      leaveTypeId: casual.leaveTypeId,
      reason: "three days casual",
      selectedDates: [
        { date: d1, session: "FULL_DAY" },
        { date: d2, session: "FULL_DAY" },
        { date: d3, session: "FULL_DAY" },
      ],
    }, adminToken);
    assert.equal(casualSubmit.status, 201, JSON.stringify(casualSubmit.json));

    console.log("[12] Half-day duration handled for medical document rule");
    const halfDraft = await jsonRequest(base, "POST", "/api/v1/leaves/drafts", {
      leaveTypeId: medical.leaveTypeId,
      reason: "half day",
      selectedDates: [{ date: addCalendarDays(today, 8), session: "FIRST_HALF" }],
    }, empToken);
    assert.equal(halfDraft.status, 201, JSON.stringify(halfDraft.json));
    assert.equal(halfDraft.json.numberOfDays, 0.5);
    const halfSubmit = await jsonRequest(
      base,
      "POST",
      `/api/v1/leaves/${Number(halfDraft.json.leaveId)}/submit`,
      undefined,
      empToken,
    );
    assert.equal(halfSubmit.status, 200, JSON.stringify(halfSubmit.json));

    console.log("[13] Zigzag leave duration handled for medical document rule");
    const zigzagDraft = await jsonRequest(base, "POST", "/api/v1/leaves/drafts", {
      leaveTypeId: medical.leaveTypeId,
      reason: "zigzag",
      selectedDates: [
        { date: addCalendarDays(today, 9), session: "FIRST_HALF" },
        { date: addCalendarDays(today, 11), session: "FULL_DAY" },
        { date: addCalendarDays(today, 13), session: "SECOND_HALF" },
      ],
    }, empToken);
    assert.equal(zigzagDraft.status, 201, JSON.stringify(zigzagDraft.json));
    assert.equal(zigzagDraft.json.numberOfDays, 2);
    const zigzagSubmit = await jsonRequest(
      base,
      "POST",
      `/api/v1/leaves/${Number(zigzagDraft.json.leaveId)}/submit`,
      undefined,
      empToken,
    );
    assert.equal(zigzagSubmit.status, 200, JSON.stringify(zigzagSubmit.json));

    const guestUpload = await uploadRequest(base, guestToken, casualDraftId, {
      name: "note.pdf",
      type: "application/pdf",
      bytes: PDF_BYTES,
    });
    assert.equal(guestUpload.status, 403);

    console.log("[14] No retention/deletion job introduced");
    const files = await readdir(path.resolve("src/modules/leave-management/leave-documents"));
    assert.equal(files.some((name) => /retain|expir|purge|cron|schedul/i.test(name)), false);

    console.log("All leave document tests passed.");
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
    await prisma.leavePolicy.deleteMany({ where: { leaveTypeId: medical.leaveTypeId } });
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
