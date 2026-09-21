import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../db/index.js";

type AuditClient = {
  auditLog: {
    create: typeof prisma.auditLog.create;
    findMany: typeof prisma.auditLog.findMany;
    count: typeof prisma.auditLog.count;
  };
};

export async function createAuditLog(
  data: {
    userId: number;
    action: string;
    entityType: string;
    entityId?: number | null;
    oldValue?: Prisma.InputJsonValue | null;
    newValue?: Prisma.InputJsonValue | null;
  },
  db: AuditClient = prisma,
) {
  return db.auditLog.create({
    data: {
      userId: data.userId,
      action: data.action.slice(0, 50),
      entityType: data.entityType.slice(0, 100),
      entityId: data.entityId ?? null,
      oldValue: data.oldValue ?? undefined,
      newValue: data.newValue ?? undefined,
    },
  });
}

export async function findManyAuditLogs(filter: {
  entityType?: string;
  skip: number;
  take: number;
}) {
  const where: Prisma.AuditLogWhereInput = {};
  if (filter.entityType) {
    where.entityType = filter.entityType;
  }
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { rows, total };
}
