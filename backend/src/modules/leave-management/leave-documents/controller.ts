import type { Request, Response } from "express";
import { env } from "../../../env.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { createAuditLog } from "../../shared/audit-logs/repository.js";
import { HttpError } from "../../shared/utils/http-error.js";
import { parseMultipart, readRequestBuffer } from "./multipart.js";
import * as leaveDocumentService from "./service.js";

//additional space for the multipart request - on top of actual file size
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

export const upload = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const contentType = req.headers["content-type"] ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    throw new HttpError(422, "UNSUPPORTED_MEDIA_TYPE", "Expected multipart/form-data");
  }

  //read the request as buffer 
  //limit = max file sie + multipart overhead
  const body = await readRequestBuffer(req, env.leaveDocumentMaxBytes + MULTIPART_OVERHEAD_BYTES);
  //extract leave id and file from the multipart request
  const parsed = parseMultipart(body, contentType);
  const document = await leaveDocumentService.uploadLeaveDocument(req.user!, parsed.leaveIdRaw, parsed.file);
  await createAuditLog({
    userId: req.user!.employeeId,
    action: "DOCUMENT_UPLOAD",
    entityType: "LeaveDocument",
    entityId: document.documentId,
    newValue: { leaveId: document.leaveId, fileType: document.fileType, fileSize: document.fileSize },
  });
  res.status(201).json(document);
});

export const download = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const file = await leaveDocumentService.downloadLeaveDocument(req.user!, Number(res.locals.params.id));
  await createAuditLog({
    userId: req.user!.employeeId,
    action: "DOCUMENT_DOWNLOAD",
    entityType: "LeaveDocument",
    entityId: Number(res.locals.params.id),
    newValue: { contentType: file.contentType },
  });
  res.setHeader("Content-Type", file.contentType);  //type of file
  res.setHeader("Content-Disposition", "attachment");  //tells the browser to download the file
  res.status(200).send(file.bytes);
});
