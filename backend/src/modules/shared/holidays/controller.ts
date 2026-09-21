import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import { createAuditLog } from "../audit-logs/repository.js";
import * as holidayService from "./service.js";
import type { CreateHolidayBody, ListHolidaysQuery } from "./validation.js";

export const list = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await holidayService.listHolidays(res.locals.query as ListHolidaysQuery);
  res.status(200).json(result);
});

export const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const holiday = await holidayService.createHoliday(req.body as CreateHolidayBody);
  await createAuditLog({
    userId: req.user!.employeeId,
    action: "HOLIDAY_CREATE",
    entityType: "Holiday",
    entityId: holiday.holidayId,
    newValue: holiday,
  });
  res.status(201).json(holiday);
});

export const remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const holidayId = Number(res.locals.params.id);
  await holidayService.deleteHoliday(holidayId);
  await createAuditLog({
    userId: req.user!.employeeId,
    action: "HOLIDAY_DELETE",
    entityType: "Holiday",
    entityId: holidayId,
  });
  res.status(204).send();
});
