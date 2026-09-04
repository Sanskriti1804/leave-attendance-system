import * as leaveStatusHistoryRepository from "./repository.js";

export async function listLeaveStatusHistory(leaveId: number) {
  const rows = await leaveStatusHistoryRepository.findHistoryByLeaveId(leaveId);
  return {
    items: rows.map((row) => ({
      historyId: row.historyId,
      leaveId: row.leaveId,
      changedById: row.changedById,
      oldStatus: row.oldStatus,
      newStatus: row.newStatus,
      reason: row.reason,
      changedAt: row.changedAt.toISOString(),
    })),
  };
}

export { createStatusHistory } from "./repository.js";
