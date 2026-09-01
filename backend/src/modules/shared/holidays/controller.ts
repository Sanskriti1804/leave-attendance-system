import type { NextFunction, Request, Response } from "express";
import * as holidayService from "./service.js";
import type { CreateHolidayBody, ListHolidaysQuery } from "./validation.js";

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await holidayService.listHolidays(res.locals.query as ListHolidaysQuery);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const holiday = await holidayService.createHoliday(req.body as CreateHolidayBody);
    res.status(201).json(holiday);
  } catch (err) {
    next(err);
  }
}

export async function remove(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await holidayService.deleteHoliday(Number(res.locals.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
