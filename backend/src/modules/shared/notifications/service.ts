import { prisma } from "../db/index.js";
import { logger } from "../../../logger.js";
import { HttpError } from "../utils/http-error.js";
import { toIsoWithIstOffset } from "../utils/dates.js";
import * as notificationRepository from "./repository.js";

function clip(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}

async function notifyOnce(params: {
  userId: number;
  type: string;
  title: string;
  message: string;
}): Promise<void> {
  const payload = {
    userId: params.userId,
    type: clip(params.type, 50),
    title: clip(params.title, 50),
    message: clip(params.message, 100),
  };
  const existing = await notificationRepository.findDuplicate({
    userId: payload.userId,
    type: payload.type,
    message: payload.message,
  });
  if (existing) {
    return;
  }
  await notificationRepository.createNotification(payload);
}

export async function safeNotify(task: () => Promise<void>): Promise<void> {
  try {
    await task();
  } catch (err) {
    logger.error({ err }, "Notification write failed");
  }
}

function toResponse(row: {
  notificationId: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}) {
  return {
    notificationId: row.notificationId,
    userId: row.userId,
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: row.isRead,
    createdAt: toIsoWithIstOffset(row.createdAt),
  };
}

export async function listMyNotifications(userId: number) {
  const [items, unreadCount] = await Promise.all([
    notificationRepository.findByUser(userId),
    notificationRepository.countUnread(userId),
  ]);
  return { items: items.map(toResponse), unreadCount };
}

export async function markNotificationRead(userId: number, notificationId: number) {
  const row = await notificationRepository.findById(notificationId);
  if (!row || row.userId !== userId) {
    throw new HttpError(404, "NOT_FOUND", "Notification not found");
  }
  if (row.isRead) {
    return toResponse(row);
  }
  const updated = await notificationRepository.markRead(notificationId);
  return toResponse(updated);
}

export async function notifyLeaveDecision(params: {
  employeeId: number;
  leaveId: number;
  kind: "APPROVED" | "REJECTED";
}): Promise<void> {
  const type = params.kind === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED";
  const title = params.kind === "APPROVED" ? "Leave approved" : "Leave rejected";
  await notifyOnce({
    userId: params.employeeId,
    type: `${type}_${params.leaveId}`,
    title,
    message: params.kind === "APPROVED" ? "Leave request approved." : "Leave request rejected.",
  });
}

export async function notifyMedicalDocumentRequired(employeeId: number, leaveId?: number): Promise<void> {
  await notifyOnce({
    userId: employeeId,
    type: leaveId ? `MEDICAL_REQUIRED_${leaveId}` : "MEDICAL_REQUIRED",
    title: "Medical proof required",
    message: "Attach medical file before submitting leave.",
  });
}

export async function notifyLeaveSubmitted(params: {
  employeeId: number;
  leaveId: number;
  status: string;
  reportingManagerEmployeeId: number | null;
}): Promise<void> {
  if (params.status === "APPROVED") {
    await notifyLeaveDecision({
      employeeId: params.employeeId,
      leaveId: params.leaveId,
      kind: "APPROVED",
    });
    return;
  }
  await notifyOnce({
    userId: params.employeeId,
    type: `LEAVE_SUBMITTED_SELF_${params.leaveId}`,
    title: "Leave submitted",
    message: "Leave request submitted for approval.",
  });
  if (params.status === "SUBMITTED" && params.reportingManagerEmployeeId) {
    await notifyOnce({
      userId: params.reportingManagerEmployeeId,
      type: `LEAVE_SUBMITTED_${params.leaveId}`,
      title: "Leave needs approval",
      message: "Leave request requires your review.",
    });
    return;
  }
  if (params.status === "PENDING_HR_REVIEW") {
    const admins = await prisma.employee.findMany({
      where: { role: "admin", obsolete: false },
      select: { employeeId: true },
    });
    for (const admin of admins) {
      if (admin.employeeId === params.employeeId) {
        continue;
      }
      await notifyOnce({
        userId: admin.employeeId,
        type: `LEAVE_SUBMITTED_${params.leaveId}`,
        title: "Leave pending HR",
        message: "Leave request requires your review.",
      });
    }
  }
}
