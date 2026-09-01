import type { Holiday, Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../db/index.js";

export type HolidayListFilter = {
  from?: Date;
  to?: Date;
};

export async function findManyHolidays(filter: HolidayListFilter): Promise<Holiday[]> {
  const where: Prisma.HolidayWhereInput = {};
  if (filter.from || filter.to) {
    where.holidayDate = {
      ...(filter.from ? { gte: filter.from } : {}),
      ...(filter.to ? { lte: filter.to } : {}),
    };
  }
  return prisma.holiday.findMany({
    where,
    orderBy: { holidayDate: "asc" },
  });
}

export function findHolidayById(holidayId: number): Promise<Holiday | null> {
  return prisma.holiday.findUnique({ where: { holidayId } });
}

export function findHolidayByDate(holidayDate: Date): Promise<Holiday | null> {
  return prisma.holiday.findUnique({ where: { holidayDate } });
}

export function createHoliday(data: { holidayName: string; holidayDate: Date }): Promise<Holiday> {
  return prisma.holiday.create({ data });
}

export function deleteHoliday(holidayId: number): Promise<Holiday> {
  return prisma.holiday.delete({ where: { holidayId } });
}
