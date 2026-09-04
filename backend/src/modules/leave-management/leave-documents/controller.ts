import type { Request, Response } from "express";
import { env } from "../../../env.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { HttpError } from "../../shared/utils/http-error.js";
import { parseMultipart, readRequestBuffer } from "./multipart.js";
import * as leaveDocumentService from "./service.js";

const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

export const upload = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const contentType = req.headers["content-type"] ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    throw new HttpError(422, "UNSUPPORTED_MEDIA_TYPE", "Expected multipart/form-data");
  }

  const body = await readRequestBuffer(req, env.leaveDocumentMaxBytes + MULTIPART_OVERHEAD_BYTES);
  const parsed = parseMultipart(body, contentType);
  const document = await leaveDocumentService.uploadLeaveDocument(req.user!, parsed.leaveIdRaw, parsed.file);
  res.status(201).json(document);
});

export const download = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const file = await leaveDocumentService.downloadLeaveDocument(req.user!, Number(res.locals.params.id));
  res.setHeader("Content-Type", file.contentType);
  res.setHeader("Content-Disposition", "attachment");
  res.status(200).send(file.bytes);
});
