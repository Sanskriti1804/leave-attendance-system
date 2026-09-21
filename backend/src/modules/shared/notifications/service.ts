import { prisma } from "../db/index.js";
import { toIsoWithIstOffset } from "../utils/dates.js";
import * as notificationRepository from "./repository.js";

async function notifyOnce(params: {
  userId: number;
  type: string;
  title: string;
  message: string;
}): Promise<void> {
  const existing = await notificationRepository.findDuplicate({
    userId: params.userId,
    type: params.type,
    message: params.message,
  });
  if (existing) {
    return;
  }
  await notificationRepository.createNotification(params);
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
  const items = await notificationRepository.findByUser(userId);
  return { items: items.map(toResponse) };
}

export async function notifyLeaveDecision(params: {
  employeeId: number;
  leaveId: number;
  kind: "APPROVED" | "REJECTED";
}): Promise<void> {
  const type = params.kind === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED";
  const title = params.kind === "APPROVED" ? "Leave approved" : "Leave rejected";
  const message =
    params.kind === "APPROVED"
      ? `Leave #${params.leaveId} approved.`
      : `Leave #${params.leaveId} rejected.`;
  await notifyOnce({
    userId: params.employeeId,
    type,
    title,
    message,
  });
}

export async function notifyMedicalDocumentRequired(employeeId: number, leaveId?: number): Promise<void> {
  await notifyOnce({
    userId: employeeId,
    type: "MEDICAL_REQUIRED",
    title: "Medical proof required",
    message: leaveId
      ? `Attach medical file before submitting #${leaveId}.`
      : "Attach medical file before submitting leave.",
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
  if (params.status === "SUBMITTED" && params.reportingManagerEmployeeId) {
    await notifyOnce({
      userId: params.reportingManagerEmployeeId,
      type: "LEAVE_SUBMITTED",
      title: "Leave needs approval",
      message: `Leave #${params.leaveId} awaits manager review.`,
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
        type: "LEAVE_SUBMITTED",
        title: "Leave pending HR",
        message: `Leave #${params.leaveId} is pending HR review.`,
      });
    }
  }
}
