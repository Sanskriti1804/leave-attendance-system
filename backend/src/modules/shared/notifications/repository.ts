import type { Notification } from "../../../generated/prisma/client.js";
import { prisma } from "../db/index.js";

export function findByUser(userId: number): Promise<Notification[]> {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export function findDuplicate(params: {
  userId: number;
  type: string;
  message: string;
}): Promise<Notification | null> {
  return prisma.notification.findFirst({
    where: params,
  });
}

export function createNotification(data: {
  userId: number;
  type: string;
  title: string;
  message: string;
}): Promise<Notification> {
  return prisma.notification.create({ data });
}
