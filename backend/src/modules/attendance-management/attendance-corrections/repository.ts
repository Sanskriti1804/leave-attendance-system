import type {
  AttendanceCorrection,
  Prisma,
} from "../../../generated/prisma/client.js";

import prisma from "../../shared/db/prisma.js";

export type AttendanceCorrectionWithDetails =
  AttendanceCorrection & {
    employee?: {
      employeeId: number;
      firstName: string;
      lastName: string | null;
      email: string;
      departmentId: number;
    };

    reviewer?: {
      employeeId: number;
      firstName: string;
      lastName: string | null;
      email: string;
    } | null;

    attendance?: {
      attendanceId: number;
      attendanceDate: Date;
      checkIn: Date | null;
      checkOut: Date | null;
      status: string;
      lateMinutes: number;
    };
  };

/**
 * Finds an existing pending correction request
 * for an employee and UTC correction date.
 */
export async function findPendingCorrectionForDate(
  employeeId: number,
  correctionDate: Date,
): Promise<AttendanceCorrection | null> {
  return prisma.attendanceCorrection.findFirst({
    where: {
      employeeId,
      correctionDate,
      status: "PENDING",
    },
  });
}

/**
 * Finds a correction request with employee,
 * reviewer and attendance details.
 */
export async function findById(
  correctionId: number,
): Promise<AttendanceCorrectionWithDetails | null> {
  return prisma.attendanceCorrection.findUnique({
    where: {
      correctionId,
    },
    include: {
      employee: {
        select: {
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
          departmentId: true,
        },
      },

      reviewer: {
        select: {
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },

      attendance: {
        select: {
          attendanceId: true,
          attendanceDate: true,
          checkIn: true,
          checkOut: true,
          status: true,
          lateMinutes: true,
        },
      },
    },
  });
}

/**
 * Creates an attendance correction request.
 */
export async function createCorrection(
  data: Prisma.AttendanceCorrectionUncheckedCreateInput,
): Promise<AttendanceCorrection> {
  return prisma.attendanceCorrection.create({
    data,
  });
}

/**
 * Updates an attendance correction request.
 */
export async function updateCorrection(
  correctionId: number,
  data: Prisma.AttendanceCorrectionUncheckedUpdateInput,
): Promise<AttendanceCorrection> {
  return prisma.attendanceCorrection.update({
    where: {
      correctionId,
    },
    data,
  });
}

export type CorrectionListFilter = {
  employeeId?: number;
  status?: string;
  skip?: number;
  take?: number;
};

/**
 * Lists attendance correction requests with
 * employee, reviewer and attendance details.
 */
export async function findManyCorrections(
  filter: CorrectionListFilter,
): Promise<{
  rows: AttendanceCorrectionWithDetails[];
  total: number;
}> {
  const where: Prisma.AttendanceCorrectionWhereInput = {};

  if (filter.employeeId) {
    where.employeeId = filter.employeeId;
  }

  if (filter.status) {
    where.status = filter.status;
  }

  const [total, rows] = await Promise.all([
    prisma.attendanceCorrection.count({
      where,
    }),

    prisma.attendanceCorrection.findMany({
      where,
      skip: filter.skip ?? 0,
      take: filter.take ?? 20,

      orderBy: {
        createdAt: "desc",
      },

      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            departmentId: true,
          },
        },

        reviewer: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        attendance: {
          select: {
            attendanceId: true,
            attendanceDate: true,
            checkIn: true,
            checkOut: true,
            status: true,
            lateMinutes: true,
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