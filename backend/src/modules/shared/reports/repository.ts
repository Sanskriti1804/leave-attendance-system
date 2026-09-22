import { prisma } from "../db/index.js";
import { fromCivilDate, toCivilDate } from "../utils/dates.js";

export async function findLeavesForRange(filter: {
  from: string;
  to: string;
  employeeId?: number;
  departmentId?: number;
}) {
  return prisma.leaveApplication.findMany({
    where: {
      startDate: { lte: fromCivilDate(filter.to) },
      endDate: { gte: fromCivilDate(filter.from) },
      ...(filter.employeeId ? { employeeId: filter.employeeId } : {}),
      ...(filter.departmentId ? { employee: { departmentId: filter.departmentId } } : {}),
    },
    include: {
      employee: { include: { department: true } },
      leaveType: true,
      reviewer: { select: { firstName: true, lastName: true } },
    },
    orderBy: { startDate: "asc" },
    take: 5000,
  });
}

export async function findAttendanceForRange(filter: {
  from: string;
  to: string;
  employeeId?: number;
  departmentId?: number;
}) {
  return prisma.attendance.findMany({
    where: {
      attendanceDate: { gte: fromCivilDate(filter.from), lte: fromCivilDate(filter.to) },
      ...(filter.employeeId ? { employeeId: filter.employeeId } : {}),
      ...(filter.departmentId ? { employee: { departmentId: filter.departmentId } } : {}),
    },
    include: {
      employee: { include: { department: true } },
    },
    orderBy: { attendanceDate: "asc" },
    take: 5000,
  });
}

export function civil(value: Date): string {
  return toCivilDate(value) ?? "";
}
