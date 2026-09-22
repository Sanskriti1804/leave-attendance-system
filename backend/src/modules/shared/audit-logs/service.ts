import { toIsoWithIstOffset } from "../utils/dates.js";
import * as auditRepository from "./repository.js";
import type { ListAuditLogsQuery } from "./validation.js";

const SECRET_KEY = /password|token|hash|otp|secret|pepper/i;

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY.test(key)) {
        continue;
      }
      out[key] = sanitize(nested);
    }
    return out;
  }
  return value;
}

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
      actorName: [row.user.firstName, row.user.lastName].filter(Boolean).join(" ").trim(),
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      oldValue: sanitize(row.oldValue),
      newValue: sanitize(row.newValue),
      createdAt: toIsoWithIstOffset(row.createdAt),
    })),
    page: query.page,
    pageSize: query.pageSize,
    total,
  };
}
