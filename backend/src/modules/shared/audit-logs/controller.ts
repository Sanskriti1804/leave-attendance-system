import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import * as auditService from "./service.js";
import type { ListAuditLogsQuery } from "./validation.js";

export const list = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await auditService.listAuditLogs(res.locals.query as ListAuditLogsQuery);
  res.status(200).json(result);
});
