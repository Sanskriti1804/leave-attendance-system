import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../shared/db/index.js";

export function findLeaveTypeById(leaveTypeId: number) {
  return prisma.leaveType.findUnique({
    where: { leaveTypeId },
  });
}

export function findManyLeaveTypes(filter: { includeObsolete: boolean }) {
  const where: Prisma.LeaveTypeWhereInput = {};
  if (!filter.includeObsolete) {
    where.obsolete = false;
  }
  return prisma.leaveType.findMany({
    where,
    orderBy: { leaveTypeId: "asc" },
  });
}

export function createLeaveType(data: {
  name: string;
  description: string | null;
  requiresMedicalDocument: boolean;
  allowedSex: string | null;
}) {
  return prisma.leaveType.create({ data });
}

export function updateLeaveType(
  leaveTypeId: number,
  data: {
    name?: string;
    description?: string | null;
    requiresMedicalDocument?: boolean;
    allowedSex?: string | null;
    obsolete?: boolean;
  },
) {
  return prisma.leaveType.update({
    where: { leaveTypeId },
    data,
  });
}

export function countLeaveTypeUsage(leaveTypeId: number) {
  return Promise.all([
    prisma.leaveApplication.count({ where: { leaveTypeId } }),
    prisma.leavePolicy.count({ where: { leaveTypeId } }),
  ]);
}

export function deleteLeaveType(leaveTypeId: number) {
  return prisma.leaveType.delete({
    where: { leaveTypeId },
  });
}
