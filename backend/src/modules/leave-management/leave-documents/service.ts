import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../../env.js";
import type { AuthTokenPayload } from "../../shared/utils/security.js";
import { HttpError } from "../../shared/utils/http-error.js";
import { getOrganisationSettings } from "../../shared/organisation-settings/service.js";
import { findLeaveById } from "../leave-applications/repository.js";
import { findLeaveTypeById } from "../leave-types/repository.js";
import * as leaveDocumentRepository from "./repository.js";
import type { MultipartFile } from "./multipart.js";
import { ALLOWED_CONTENT_TYPES, ALLOWED_EXTENSIONS, uploadLeaveIdSchema } from "./validation.js";

const PDF_MAGIC = Buffer.from("%PDF");
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

type DetectedFile = {
  extension: (typeof ALLOWED_EXTENSIONS)[number];
  contentType: "application/pdf" | "image/jpeg" | "image/png";
};

function uploadsRoot(): string {
  return path.resolve(env.leaveDocumentsDir);
}

function extensionOf(filename: string): string {
  const base = path.basename(filename).toLowerCase();
  const idx = base.lastIndexOf(".");
  return idx >= 0 ? base.slice(idx + 1) : "";
}

function detectFile(buffer: Buffer, originalName: string, declaredContentType: string): DetectedFile {
  if (buffer.length === 0) {
    throw new HttpError(422, "VALIDATION_ERROR", "File must not be empty");
  }

  const declared = declaredContentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (declared && !(ALLOWED_CONTENT_TYPES as readonly string[]).includes(declared)) {
    throw new HttpError(422, "UNSUPPORTED_MEDIA_TYPE", "Unsupported file type");
  }

  const ext = extensionOf(originalName);
  if (ext && !(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new HttpError(422, "UNSUPPORTED_MEDIA_TYPE", "Unsupported file type");
  }

  let detected: DetectedFile | null = null;
  if (buffer.subarray(0, 4).equals(PDF_MAGIC)) {
    detected = { extension: "pdf", contentType: "application/pdf" };
  } else if (buffer.length >= 3 && buffer.subarray(0, 3).equals(JPEG_MAGIC)) {
    const jpegExt = ext === "jpg" ? "jpg" : "jpeg";
    detected = { extension: jpegExt, contentType: "image/jpeg" };
  } else if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_MAGIC)) {
    detected = { extension: "png", contentType: "image/png" };
  }

  if (!detected) {
    throw new HttpError(422, "UNSUPPORTED_MEDIA_TYPE", "Unsupported file type");
  }

  if (ext) {
    const jpegFamily = (value: string) => value === "jpg" || value === "jpeg";
    const extMatches =
      detected.extension === ext || (jpegFamily(detected.extension) && jpegFamily(ext));
    if (!extMatches) {
      throw new HttpError(422, "UNSUPPORTED_MEDIA_TYPE", "File extension does not match file contents");
    }
  }

  if (declared) {
    const declaredJpeg = declared === "image/jpeg" || declared === "image/jpg";
    const contentMatches =
      declared === detected.contentType || (detected.contentType === "image/jpeg" && declaredJpeg);
    if (!contentMatches) {
      throw new HttpError(422, "UNSUPPORTED_MEDIA_TYPE", "Content type does not match file contents");
    }
  }

  return detected;
}

function safeStoredName(originalName: string, extension: string): string {
  const base = path.basename(originalName).replace(/[^\w.\- ()]/g, "_");
  const withoutExt = base.replace(/\.[^.]+$/, "") || "document";
  const clipped = withoutExt.slice(0, Math.max(1, 50 - extension.length - 1));
  return `${clipped}.${extension}`.slice(0, 50);
}

function canReadLeave(
  leave: { employeeId: number; reportingManagerEmployeeId: number | null },
  actor: AuthTokenPayload,
): boolean {
  if (actor.role === "admin" || actor.role === "guest_admin") {
    return true;
  }
  if (leave.employeeId === actor.employeeId) {
    return true;
  }
  return leave.reportingManagerEmployeeId === actor.employeeId;
}

export async function isMedicalDocumentRequired(leaveTypeId: number, numberOfDays: number): Promise<boolean> {
  const leaveType = await findLeaveTypeById(leaveTypeId);
  if (!leaveType || leaveType.obsolete) {
    throw new HttpError(422, "LEAVE_TYPE_NOT_ELIGIBLE", "Leave type not found or is obsolete");
  }
  if (!leaveType.requiresMedicalDocument) {
    return false;
  }

  const settings = await getOrganisationSettings();
  const policyAfterDays = leaveType.policies[0]?.medicalDocumentAfterDays;
  const exceedsDays = policyAfterDays ?? settings.medicalDocExceedsDays;

  if (numberOfDays > exceedsDays) {
    return true;
  }
  if (numberOfDays > 0 && numberOfDays <= exceedsDays) {
    return !settings.medicalDocOptional1To2Days;
  }
  return false;
}

export async function assertMedicalDocumentsForSubmit(params: {
  leaveTypeId: number;
  numberOfDays: number;
  leaveId?: number;
}): Promise<void> {
  const required = await isMedicalDocumentRequired(params.leaveTypeId, params.numberOfDays);
  if (!required) {
    return;
  }
  const documentCount = params.leaveId
    ? await leaveDocumentRepository.countDocumentsForLeave(params.leaveId)
    : 0;
  if (documentCount === 0) {
    throw new HttpError(422, "MEDICAL_DOCUMENT_REQUIRED", "A medical document is required for this leave");
  }
}

function toDocumentResponse(row: {
  documentId: number;
  leaveId: number;
  fileName: string;
  fileType: string;
  contentType: string;
  fileSize: number;
  uploadedBy: number;
  uploadedAt: Date;
}) {
  return {
    documentId: row.documentId,
    leaveId: row.leaveId,
    fileName: row.fileName,
    fileType: row.fileType,
    contentType: row.contentType,
    fileSize: row.fileSize,
    uploadedBy: row.uploadedBy,
    uploadedAt: row.uploadedAt.toISOString(),
  };
}

export async function uploadLeaveDocument(
  actor: AuthTokenPayload,
  leaveIdRaw: string | undefined,
  file: MultipartFile | undefined,
) {
  if (actor.role === "guest_admin") {
    throw new HttpError(403, "FORBIDDEN", "You do not have permission to perform this action");
  }
  if (!file) {
    throw new HttpError(422, "VALIDATION_ERROR", "A file is required");
  }
  const parsedLeaveId = uploadLeaveIdSchema.safeParse(leaveIdRaw);
  if (!parsedLeaveId.success) {
    throw new HttpError(422, "VALIDATION_ERROR", "leaveId is required");
  }
  const leaveId = parsedLeaveId.data;
  const leave = await findLeaveById(leaveId);
  if (!leave) {
    throw new HttpError(404, "NOT_FOUND", "Leave application not found");
  }
  const isOwner = leave.employeeId === actor.employeeId;
  if (!isOwner && actor.role !== "admin") {
    throw new HttpError(404, "NOT_FOUND", "Leave application not found");
  }
  if (leave.status !== "DRAFT") {
    throw new HttpError(409, "LEAVE_INVALID_TRANSITION", "Documents can only be attached to draft applications");
  }

  if (file.buffer.length > env.leaveDocumentMaxBytes) {
    throw new HttpError(422, "FILE_TOO_LARGE", "File exceeds the maximum allowed size");
  }

  const detected = detectFile(file.buffer, file.originalName, file.declaredContentType);
  const storedName = safeStoredName(file.originalName, detected.extension);
  const objectKey = `${leaveId}/${randomUUID()}.${detected.extension}`;
  const absolutePath = path.join(uploadsRoot(), objectKey);
  const resolved = path.resolve(absolutePath);
  if (!resolved.startsWith(uploadsRoot() + path.sep) && resolved !== uploadsRoot()) {
    throw new HttpError(422, "VALIDATION_ERROR", "Invalid storage path");
  }

  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, file.buffer);

  const created = await leaveDocumentRepository.createLeaveDocument({
    leaveId,
    fileName: storedName,
    filePath: objectKey,
    fileType: detected.extension,
    contentType: detected.contentType,
    fileSize: file.buffer.length,
    uploadedBy: actor.employeeId,
  });

  return toDocumentResponse(created);
}

export async function downloadLeaveDocument(actor: AuthTokenPayload, documentId: number) {
  const document = await leaveDocumentRepository.findLeaveDocumentById(documentId);
  if (!document || !canReadLeave(document.leave, actor)) {
    throw new HttpError(404, "NOT_FOUND", "Document not found");
  }

  const isMedical = document.leave.leaveType.requiresMedicalDocument;
  if (isMedical && actor.role === "employee") {
    throw new HttpError(403, "FORBIDDEN", "Employees cannot download medical documents");
  }

  const absolutePath = path.resolve(uploadsRoot(), document.filePath);
  if (!absolutePath.startsWith(uploadsRoot() + path.sep)) {
    throw new HttpError(404, "NOT_FOUND", "Document not found");
  }

  const bytes = await readFile(absolutePath);
  return {
    contentType: document.contentType,
    fileName: document.fileName,
    bytes,
  };
}
