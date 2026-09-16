import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../db/index.js";

export async function createAuditLog(data: {
  userId: number;
  action: string;
  entityType: string;
  entityId?: number | null;
  oldValue?: Prisma.InputJsonValue | null;
  newValue?: Prisma.InputJsonValue | null;
}) {
  return prisma.auditLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ?? null,
      oldValue: data.oldValue ?? undefined,
      newValue: data.newValue ?? undefined,
    },
  });
}
