import { HttpError } from "../utils/http-error.js";
import { fromCivilDate, toCivilDate } from "../utils/dates.js";
import * as holidayRepository from "./repository.js";
import type { CreateHolidayBody, ListHolidaysQuery } from "./validation.js";
import type { Holiday } from "../../../generated/prisma/client.js";

function toHolidayResponse(holiday: Holiday) {
  return {
    holidayId: holiday.holidayId,
    holidayName: holiday.holidayName,
    holidayDate: toCivilDate(holiday.holidayDate),
  };
}

export async function listHolidays(query: ListHolidaysQuery) {
  const rows = await holidayRepository.findManyHolidays({
    from: query.from ? fromCivilDate(query.from) : undefined,
    to: query.to ? fromCivilDate(query.to) : undefined,
  });
  return {
    items: rows.map(toHolidayResponse),
    from: query.from ?? null,
    to: query.to ?? null,
  };
}

export async function createHoliday(body: CreateHolidayBody) {
  const holidayDate = fromCivilDate(body.date);
  const existing = await holidayRepository.findHolidayByDate(holidayDate);
  if (existing) {
    throw new HttpError(409, "CONFLICT", "A holiday already exists for this date");
  }
  const created = await holidayRepository.createHoliday({
    holidayName: body.name,
    holidayDate,
  });
  return toHolidayResponse(created);
}

export async function deleteHoliday(holidayId: number): Promise<void> {
  const holiday = await holidayRepository.findHolidayById(holidayId);
  if (!holiday) {
    throw new HttpError(404, "NOT_FOUND", "Holiday not found");
  }
  await holidayRepository.deleteHoliday(holidayId);
}
