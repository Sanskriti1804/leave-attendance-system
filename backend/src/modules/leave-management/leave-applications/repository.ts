import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../shared/db/index.js";

export const leaveInclude = {
  dateSelections: { orderBy: { leaveDate: "asc" as const } },
  documents: true,
} satisfies Prisma.LeaveApplicationInclude;

export type LeaveWithSelections = Prisma.LeaveApplicationGetPayload<{ include: typeof leaveInclude }>;

export function findLeaveById(leaveId: number): Promise<LeaveWithSelections | null> {
  return prisma.leaveApplication.findUnique({
    where: { leaveId },
    include: leaveInclude,
  });
}

export async function findManyLeaves(filter: {
  employeeId?: number;
  status?: string;
  skip: number;
  take: number;
}): Promise<{ rows: LeaveWithSelections[]; total: number }> {
  const where: Prisma.LeaveApplicationWhereInput = {};
  if (filter.employeeId !== undefined) {
    where.employeeId = filter.employeeId;
  }
  if (filter.status !== undefined) {
    where.status = filter.status;
  }

  const [rows, total] = await Promise.all([
    prisma.leaveApplication.findMany({
      where,
      include: leaveInclude,
      skip: filter.skip,
      take: filter.take,
      orderBy: { leaveId: "desc" },
    }),
    prisma.leaveApplication.count({ where }),
  ]);
  return { rows, total };
}

export function findBlockingSelections(params: {
  employeeId: number;
  dates: Date[];
  excludeLeaveId?: number;
  statuses: string[];
}) {
  return prisma.leaveDateSelection.findMany({
    where: {
      leaveDate: { in: params.dates },
      leave: {
        employeeId: params.employeeId,
        status: { in: params.statuses },
        ...(params.excludeLeaveId !== undefined ? { leaveId: { not: params.excludeLeaveId } } : {}),
      },
    },
    include: { leave: true },
  });
}
