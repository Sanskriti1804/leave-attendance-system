import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import * as leaveApplicationService from "../leave-applications/service.js";
import * as leaveStatusHistoryService from "./service.js";

export const list = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const leaveId = Number(res.locals.params.id);
  await leaveApplicationService.assertCanReadLeave(leaveId, _req.user!);
  const result = await leaveStatusHistoryService.listLeaveStatusHistory(leaveId);
  res.status(200).json(result);
});
