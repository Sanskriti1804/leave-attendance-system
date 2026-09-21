import { toIsoWithIstOffset } from "../utils/dates.js";
import * as auditRepository from "./repository.js";
import type { ListAuditLogsQuery } from "./validation.js";

export async function listAuditLogs(query: ListAuditLogsQuery) {
  const { rows, total } = await auditRepository.findManyAuditLogs({
    entityType: query.entityType,
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  });
  return {
    items: rows.map((row) => ({
      auditId: row.auditId,
      userId: row.userId,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      oldValue: row.oldValue,
      newValue: row.newValue,
      createdAt: toIsoWithIstOffset(row.createdAt),
    })),
    page: query.page,
    pageSize: query.pageSize,
    total,
  };
}
