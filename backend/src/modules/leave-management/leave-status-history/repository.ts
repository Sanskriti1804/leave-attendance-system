import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../shared/db/index.js";

export async function createStatusHistory(
  tx: Prisma.TransactionClient,
  data: {
    leaveId: number;
    changedById: number | null;
    oldStatus: string | null;
    newStatus: string;
    reason?: string | null;
  },
) {
  const history = await tx.leaveStatusHistory.create({
    data: {
      leaveId: data.leaveId,
      changedById: data.changedById,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus,
      reason: data.reason ?? null,
    },
  });
  if (data.changedById != null) {
    await tx.auditLog.create({
      data: {
        userId: data.changedById,
        action: `LEAVE_${data.newStatus}`.slice(0, 50),
        entityType: "LeaveApplication",
        entityId: data.leaveId,
        oldValue: data.oldStatus ? { status: data.oldStatus } : undefined,
        newValue: { status: data.newStatus, reason: data.reason ?? null },
      },
    });
  }
  return history;
}

export function findHistoryByLeaveId(leaveId: number) {
  return prisma.leaveStatusHistory.findMany({
    where: { leaveId },
    orderBy: { changedAt: "asc" },
  });
}
