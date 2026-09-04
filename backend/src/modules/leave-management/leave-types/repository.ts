import { prisma } from "../../shared/db/index.js";

export function findLeaveTypeById(leaveTypeId: number) {
  return prisma.leaveType.findUnique({
    where: { leaveTypeId },
    include: {
      policies: {
        where: { obsolete: false },
        orderBy: { policyId: "desc" },
        take: 1,
      },
    },
  });
}
