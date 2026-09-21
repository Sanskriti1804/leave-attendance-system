import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import { HttpError } from "../utils/http-error.js";
import * as notificationService from "./service.js";

export const listMine = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  const result = await notificationService.listMyNotifications(req.user.employeeId);
  res.status(200).json(result);
});

export const markRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }
  const result = await notificationService.markNotificationRead(
    req.user.employeeId,
    Number(res.locals.params.id),
  );
  res.status(200).json(result);
});
