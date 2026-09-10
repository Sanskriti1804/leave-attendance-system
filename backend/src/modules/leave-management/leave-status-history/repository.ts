import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../shared/db/index.js";

export function createStatusHistory(
  tx: Prisma.TransactionClient,
  data: {
    leaveId: number;
    changedById: number | null;
    oldStatus: string | null;
    newStatus: string;
    reason?: string | null;
  },
) {
  return tx.leaveStatusHistory.create({
    data: {
      leaveId: data.leaveId,
      changedById: data.changedById,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus,
      reason: data.reason ?? null,
    },
  });
}

export function findHistoryByLeaveId(leaveId: number) {
  return prisma.leaveStatusHistory.findMany({
    where: { leaveId },
    orderBy: { changedAt: "asc" },
  });
}
