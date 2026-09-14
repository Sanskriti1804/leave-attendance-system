import type { Attendance, Prisma } from "../../../generated/prisma/client.js";
import prisma from "../../shared/db/prisma.js";

export type AttendanceWithEmployee = Attendance & {
  employee?: {
    employeeId: number;
    firstName: string;
    lastName: string | null;
    email: string;
    departmentId: number;
    department: {
      departmentName: string;
    };
  };
};

export async function findByEmployeeAndDate(
  employeeId: number,
  attendanceDate: Date,
): Promise<Attendance | null> {
  return prisma.attendance.findUnique({
    where: {
      employeeId_attendanceDate: {
        employeeId,
        attendanceDate,
      },
    },
  });
}

export async function findById(
  attendanceId: number,
): Promise<AttendanceWithEmployee | null> {
  return prisma.attendance.findUnique({
    where: { attendanceId },
    include: {
      employee: {
        select: {
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
          departmentId: true,
          department: {
            select: {
              departmentName: true,
            },
          },
        },
      },
    },
  });
}

export async function createAttendance(
  data: Prisma.AttendanceUncheckedCreateInput,
): Promise<Attendance> {
  return prisma.attendance.create({
    data,
  });
}

export async function updateAttendance(
  attendanceId: number,
  data: Prisma.AttendanceUncheckedUpdateInput,
): Promise<Attendance> {
  return prisma.attendance.update({
    where: { attendanceId },
    data,
  });
}

export type AttendanceListFilter = {
  date?: Date;
  employeeId?: number;
  departmentId?: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  take?: number;
};

export async function findManyAttendance(
  filter: AttendanceListFilter,
): Promise<{
  rows: AttendanceWithEmployee[];
  total: number;
}> {
  const where: Prisma.AttendanceWhereInput = {};

  if (filter.employeeId) {
    where.employeeId = filter.employeeId;
  }

  if (filter.departmentId) {
    where.employee = {
      departmentId: filter.departmentId,
    };
  }

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.date) {
    where.attendanceDate = filter.date;
  } else if (filter.startDate || filter.endDate) {
    where.attendanceDate = {
      ...(filter.startDate ? { gte: filter.startDate } : {}),
      ...(filter.endDate ? { lte: filter.endDate } : {}),
    };
  }

  const [total, rows] = await Promise.all([
    prisma.attendance.count({
      where,
    }),

    prisma.attendance.findMany({
      where,
      skip: filter.skip ?? 0,
      take: filter.take ?? 20,
      orderBy: {
        attendanceDate: "desc",
      },
      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            departmentId: true,
            department: {
              select: {
                departmentName: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    rows,
    total,
  };
}

export async function findEmployeeAttendanceStats(
  employeeId: number,
  startDate: Date,
  endDate: Date,
): Promise<Attendance[]> {
  return prisma.attendance.findMany({
    where: {
      employeeId,
      attendanceDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      attendanceDate: "desc",
    },
  });
}