import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../shared/db/index.js";

export function findLeavePolicyById(policyId: number) {
  return prisma.leavePolicy.findUnique({
    where: { policyId },
  });
}

export function findActivePolicyByLeaveTypeId(leaveTypeId: number) {
  return prisma.leavePolicy.findFirst({
    where: { leaveTypeId, obsolete: false },
    orderBy: { policyId: "desc" },
  });
}

export function findManyLeavePolicies(filter: { leaveTypeId?: number; includeObsolete: boolean }) {
  const where: Prisma.LeavePolicyWhereInput = {};
  if (filter.leaveTypeId !== undefined) {
    where.leaveTypeId = filter.leaveTypeId;
  }
  if (!filter.includeObsolete) {
    where.obsolete = false;
  }
  return prisma.leavePolicy.findMany({
    where,
    orderBy: { policyId: "desc" },
  });
}

export function createLeavePolicy(data: {
  leaveTypeId: number;
  medicalDocumentAfterDays: number | null;
  includeWeekends: boolean;
  includeHolidays: boolean;
  maxDays: Prisma.Decimal | null;
}) {
  return prisma.leavePolicy.create({ data });
}

export function updateLeavePolicy(
  policyId: number,
  data: {
    medicalDocumentAfterDays?: number | null;
    includeWeekends?: boolean;
    includeHolidays?: boolean;
    maxDays?: Prisma.Decimal | null;
    obsolete?: boolean;
  },
) {
  return prisma.leavePolicy.update({
    where: { policyId },
    data,
  });
}
