import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import * as holidayService from "./service.js";
import type { CreateHolidayBody, ListHolidaysQuery } from "./validation.js";

export const list = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await holidayService.listHolidays(res.locals.query as ListHolidaysQuery);
  res.status(200).json(result);
});

export const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const holiday = await holidayService.createHoliday(req.body as CreateHolidayBody);
  res.status(201).json(holiday);
});

export const remove = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  await holidayService.deleteHoliday(Number(res.locals.params.id));
  res.status(204).send();
});
