import { prisma } from "../../shared/db/index.js";

export function findLeaveTypeById(leaveTypeId: number) {
  return prisma.leaveType.findUnique({
    where: { leaveTypeId },
  });
}
