import { Prisma } from "../../../generated/prisma/client.js";
import { env } from "../../../env.js";
import type { AuthTokenPayload } from "../../shared/utils/security.js";
import { findEmployeeById } from "../../shared/employees/repository.js";
import { getOrganisationSettings } from "../../shared/organisation-settings/service.js";
import { findManyHolidays } from "../../shared/holidays/repository.js";
import { HttpError } from "../../shared/utils/http-error.js";
import {
  addCalendarDays,
  fromCivilDate,
  isoWeekday,
  toCivilDate,
  todayInTimeZone,
} from "../../shared/utils/dates.js";
import { prisma } from "../../shared/db/index.js";
import { findLeaveTypeById } from "../leave-types/repository.js";
import { createStatusHistory } from "../leave-status-history/repository.js";
import * as leaveRepository from "./repository.js";
import type { LeaveWithSelections } from "./repository.js";
import type {
  DateSelectionInput,
  LeaveApplicationBody,
  ListLeavesQuery,
  ReviewBody,
  UpdateLeaveDraftBody,
} from "./validation.js";

const SESSION_UNITS: Record<string, number> = {
  FULL_DAY: 1.0,
  FIRST_HALF: 0.5,
  SECOND_HALF: 0.5,
};

const BLOCKING_STATUSES = ["SUBMITTED", "PENDING_HR_REVIEW", "APPROVED"];

type PreparedSelection = {
  leaveDate: Date;
  civilDate: string;
  session: string;
  unit: number;
};

type Warning = { code: string; message: string };

function unitForSession(session: string): number {
  return SESSION_UNITS[session];
}

function sessionsConflict(existing: string, incoming: string): boolean {
  if (existing === "FULL_DAY" || incoming === "FULL_DAY") {
    return true;
  }
  return existing === incoming;
}

function toLeaveResponse(leave: LeaveWithSelections, warnings: Warning[] = []) {
  const body = {
    leaveId: leave.leaveId,
    employeeId: leave.employeeId,
    leaveTypeId: leave.leaveTypeId,
    startDate: toCivilDate(leave.startDate),
    endDate: toCivilDate(leave.endDate),
    durationType: leave.durationType,
    halfDayType: leave.halfDayType,
    numberOfDays: Number(leave.numberOfDays),
    reason: leave.reason,
    status: leave.status,
    hrComments: leave.hrComments,
    reviewedBy: leave.reviewedBy,
    reviewedAt: leave.reviewedAt ? leave.reviewedAt.toISOString() : null,
    reportingManagerEmployeeId: leave.reportingManagerEmployeeId,
    managerApprovalStatus: leave.managerApprovalStatus,
    managerReviewedAt: leave.managerReviewedAt ? leave.managerReviewedAt.toISOString() : null,
    managerComments: leave.managerComments,
    createdAt: leave.createdAt.toISOString(),
    updatedAt: leave.updatedAt.toISOString(),
    selectedDates: leave.dateSelections.map((row) => ({
      date: toCivilDate(row.leaveDate),
      session: row.session,
      unit: Number(row.unit),
    })),
  };
  if (warnings.length > 0) {
    return { ...body, warnings };
  }
  return body;
}

function canReadLeave(leave: LeaveWithSelections, actor: AuthTokenPayload): boolean {
  if (actor.role === "admin" || actor.role === "guest_admin") {
    return true;
  }
  if (leave.employeeId === actor.employeeId) {
    return true;
  }
  return leave.reportingManagerEmployeeId === actor.employeeId;
}

export async function assertCanReadLeave(leaveId: number, actor: AuthTokenPayload): Promise<LeaveWithSelections> {
  const leave = await leaveRepository.findLeaveById(leaveId);
  if (!leave || !canReadLeave(leave, actor)) {
    throw new HttpError(404, "NOT_FOUND", "Leave application not found");
  }
  return leave;
}

function prepareSelections(selectedDates: DateSelectionInput[]): PreparedSelection[] {
  const seen = new Set<string>();
  const prepared: PreparedSelection[] = [];
  for (const item of selectedDates) {
    if (seen.has(item.date)) {
      throw new HttpError(422, "VALIDATION_ERROR", "Duplicate selected dates are not allowed");
    }
    seen.add(item.date);
    prepared.push({
      leaveDate: fromCivilDate(item.date),
      civilDate: item.date,
      session: item.session,
      unit: unitForSession(item.session),
    });
  }
  prepared.sort((a, b) => a.civilDate.localeCompare(b.civilDate));
  return prepared;
}

function deriveSummary(prepared: PreparedSelection[]) {
  const startDate = prepared[0]!.civilDate;
  const endDate = prepared[prepared.length - 1]!.civilDate;
  const numberOfDays = prepared.reduce((sum, row) => sum + row.unit, 0);
  const uniqueSessions = new Set(prepared.map((row) => row.session));
  let durationType = "MULTI_DAY";
  let halfDayType: string | null = null;
  if (prepared.length === 1 && uniqueSessions.has("FULL_DAY")) {
    durationType = "FULL_DAY";
  } else if (prepared.length === 1) {
    durationType = "HALF_DAY";
    halfDayType = prepared[0]!.session;
  }
  return { startDate, endDate, numberOfDays, durationType, halfDayType };
}

async function assertCountableDates(prepared: PreparedSelection[]): Promise<void> {
  const settings = await getOrganisationSettings();
  const weekendDows =
    settings.weeklyOffDow.length > 0 ? settings.weeklyOffDow : settings.leaveCountExcludesWeekends ? [6, 7] : [];
  const holidayDates = new Set<string>();
  if (settings.leaveCountExcludesHolidays) {
    const holidays = await findManyHolidays({
      from: fromCivilDate(prepared[0]!.civilDate),
      to: fromCivilDate(prepared[prepared.length - 1]!.civilDate),
    });
    for (const holiday of holidays) {
      const civil = toCivilDate(holiday.holidayDate);
      if (civil) {
        holidayDates.add(civil);
      }
    }
  }

  for (const row of prepared) {
    if (settings.leaveCountExcludesWeekends && weekendDows.includes(isoWeekday(row.civilDate))) {
      throw new HttpError(
        422,
        "VALIDATION_ERROR",
        `Selected date ${row.civilDate} falls on a weekly off and is excluded from leave`,
      );
    }
    if (settings.leaveCountExcludesHolidays && holidayDates.has(row.civilDate)) {
      throw new HttpError(
        422,
        "VALIDATION_ERROR",
        `Selected date ${row.civilDate} is a holiday and is excluded from leave`,
      );
    }
  }
}

function assertAdvanceWindow(prepared: PreparedSelection[]): void {
  const today = todayInTimeZone(env.appTimezone);
  const maxDate = addCalendarDays(today, env.leaveMaxAdvanceDays);
  for (const row of prepared) {
    if (row.civilDate < today || row.civilDate > maxDate) {
      throw new HttpError(
        422,
        "TOO_FAR_AHEAD",
        `Leave dates must be between ${today} and ${maxDate} (inclusive)`,
      );
    }
  }
}

async function findOverlap(params: {
  employeeId: number;
  prepared: PreparedSelection[];
  excludeLeaveId?: number;
}): Promise<{ blocking: LeaveWithSelections["dateSelections"]; rejectedWarnings: Warning[] }> {
  const dates = params.prepared.map((row) => row.leaveDate);
  const incomingByDate = new Map(params.prepared.map((row) => [row.civilDate, row.session]));

  const blockingRows = await leaveRepository.findBlockingSelections({
    employeeId: params.employeeId,
    dates,
    excludeLeaveId: params.excludeLeaveId,
    statuses: BLOCKING_STATUSES,
  });

  const conflicts = blockingRows.filter((row) => {
    const civil = toCivilDate(row.leaveDate);
    if (!civil) {
      return false;
    }
    const incoming = incomingByDate.get(civil);
    return incoming !== undefined && sessionsConflict(row.session, incoming);
  });

  if (conflicts.length > 0) {
    throw new HttpError(409, "LEAVE_OVERLAP", "Leave dates overlap an existing application", {
      leaveIds: [...new Set(conflicts.map((row) => row.leaveId))],
    });
  }

  const rejectedRows = await leaveRepository.findBlockingSelections({
    employeeId: params.employeeId,
    dates,
    excludeLeaveId: params.excludeLeaveId,
    statuses: ["REJECTED"],
  });
  const rejectedConflicts = rejectedRows.filter((row) => {
    const civil = toCivilDate(row.leaveDate);
    if (!civil) {
      return false;
    }
    const incoming = incomingByDate.get(civil);
    return incoming !== undefined && sessionsConflict(row.session, incoming);
  });

  const rejectedWarnings: Warning[] = [];
  if (rejectedConflicts.length > 0) {
    rejectedWarnings.push({
      code: "REJECTED_LEAVE_OVERLAP",
      message: "A previous application for these dates was rejected. You may continue submitting.",
    });
  }

  return { blocking: [], rejectedWarnings };
}

async function assertLeaveTypeEligible(
  leaveTypeId: number,
  employeeSex: string | null,
  numberOfDays: number,
  leaveId?: number,
): Promise<void> {
  const leaveType = await findLeaveTypeById(leaveTypeId);
  if (!leaveType || leaveType.obsolete) {
    throw new HttpError(422, "LEAVE_TYPE_NOT_ELIGIBLE", "Leave type not found or is obsolete");
  }
  if (leaveType.allowedSex && leaveType.allowedSex !== "unspecified") {
    if (!employeeSex || employeeSex !== leaveType.allowedSex) {
      throw new HttpError(422, "LEAVE_TYPE_NOT_ELIGIBLE", "Employee is not eligible for this leave type");
    }
  }

  const settings = await getOrganisationSettings();
  const medicalRequired =
    leaveType.requiresMedicalDocument &&
    (numberOfDays > settings.medicalDocExceedsDays ||
      (numberOfDays > 0 && numberOfDays <= settings.medicalDocExceedsDays && !settings.medicalDocOptional1To2Days));

  if (medicalRequired) {
    const documentCount = leaveId ? await leaveRepository.countDocumentsForLeave(leaveId) : 0;
    if (documentCount === 0) {
      throw new HttpError(422, "MEDICAL_DOCUMENT_REQUIRED", "A medical document is required for this leave");
    }
  }
}

async function loadActorEmployee(actor: AuthTokenPayload) {
  const employee = await findEmployeeById(actor.employeeId);
  if (!employee || employee.obsolete || employee.status !== "ACTIVE") {
    throw new HttpError(401, "UNAUTHORIZED", "Account is inactive or does not exist");
  }
  return employee;
}

async function persistLeave(
  tx: Prisma.TransactionClient,
  data: {
    leaveId?: number;
    employeeId: number;
    leaveTypeId: number;
    reason: string;
    prepared: PreparedSelection[];
    reportingManagerEmployeeId: number | null;
    status: string;
    managerApprovalStatus: string | null;
  },
): Promise<LeaveWithSelections> {
  const summary = deriveSummary(data.prepared);
  const payload = {
    leaveTypeId: data.leaveTypeId,
    reason: data.reason,
    startDate: fromCivilDate(summary.startDate),
    endDate: fromCivilDate(summary.endDate),
    durationType: summary.durationType,
    halfDayType: summary.halfDayType,
    numberOfDays: new Prisma.Decimal(summary.numberOfDays.toFixed(2)),
    reportingManagerEmployeeId: data.reportingManagerEmployeeId,
    status: data.status,
    managerApprovalStatus: data.managerApprovalStatus,
    dateSelections: {
      create: data.prepared.map((row) => ({
        leaveDate: row.leaveDate,
        session: row.session,
        unit: new Prisma.Decimal(row.unit.toFixed(1)),
      })),
    },
  };

  if (data.leaveId !== undefined) {
    await tx.leaveDateSelection.deleteMany({ where: { leaveId: data.leaveId } });
    return tx.leaveApplication.update({
      where: { leaveId: data.leaveId },
      data: payload,
      include: leaveRepository.leaveInclude,
    });
  }

  return tx.leaveApplication.create({
    data: {
      employeeId: data.employeeId,
      ...payload,
    },
    include: leaveRepository.leaveInclude,
  });
}

async function applySubmitTransitions(
  tx: Prisma.TransactionClient,
  leave: LeaveWithSelections,
  actor: AuthTokenPayload,
): Promise<LeaveWithSelections> {
  await createStatusHistory(tx, {
    leaveId: leave.leaveId,
    changedById: actor.employeeId,
    oldStatus: "DRAFT",
    newStatus: "SUBMITTED",
  });

  if (actor.role === "admin" && leave.employeeId === actor.employeeId) {
    const approved = await tx.leaveApplication.update({
      where: { leaveId: leave.leaveId },
      data: {
        status: "APPROVED",
        reviewedBy: actor.employeeId,
        reviewedAt: new Date(),
        managerApprovalStatus: null,
      },
      include: leaveRepository.leaveInclude,
    });
    await createStatusHistory(tx, {
      leaveId: leave.leaveId,
      changedById: actor.employeeId,
      oldStatus: "SUBMITTED",
      newStatus: "APPROVED",
      reason: "HR_ADMIN_SELF_APPROVAL",
    });
    return approved;
  }

  if (leave.reportingManagerEmployeeId) {
    return tx.leaveApplication.update({
      where: { leaveId: leave.leaveId },
      data: {
        status: "SUBMITTED",
        managerApprovalStatus: "PENDING",
      },
      include: leaveRepository.leaveInclude,
    });
  }

  const pendingHr = await tx.leaveApplication.update({
    where: { leaveId: leave.leaveId },
    data: {
      status: "PENDING_HR_REVIEW",
      managerApprovalStatus: null,
    },
    include: leaveRepository.leaveInclude,
  });
  await createStatusHistory(tx, {
    leaveId: leave.leaveId,
    changedById: actor.employeeId,
    oldStatus: "SUBMITTED",
    newStatus: "PENDING_HR_REVIEW",
  });
  return pendingHr;
}

async function validatePayload(
  body: LeaveApplicationBody,
  employee: { employeeId: number; sex: string | null },
  excludeLeaveId?: number,
): Promise<{ prepared: PreparedSelection[]; warnings: Warning[] }> {
  const prepared = prepareSelections(body.selectedDates);
  if (deriveSummary(prepared).numberOfDays <= 0) {
    throw new HttpError(422, "LEAVE_DAYS_ZERO", "Leave duration must be greater than zero");
  }
  assertAdvanceWindow(prepared);
  await assertCountableDates(prepared);
  const { rejectedWarnings } = await findOverlap({
    employeeId: employee.employeeId,
    prepared,
    excludeLeaveId,
  });
  await assertLeaveTypeEligible(
    body.leaveTypeId,
    employee.sex,
    deriveSummary(prepared).numberOfDays,
    excludeLeaveId,
  );
  return { prepared, warnings: rejectedWarnings };
}

export async function createDraft(actor: AuthTokenPayload, body: LeaveApplicationBody) {
  if (actor.role === "guest_admin") {
    throw new HttpError(403, "FORBIDDEN", "You do not have permission to perform this action");
  }
  const employee = await loadActorEmployee(actor);
  const { prepared, warnings } = await validatePayload(body, employee);
  const leave = await prisma.$transaction((tx) =>
    persistLeave(tx, {
      employeeId: employee.employeeId,
      leaveTypeId: body.leaveTypeId,
      reason: body.reason,
      prepared,
      reportingManagerEmployeeId: employee.managerId,
      status: "DRAFT",
      managerApprovalStatus: null,
    }),
  );
  return toLeaveResponse(leave, warnings);
}

export async function submitNew(actor: AuthTokenPayload, body: LeaveApplicationBody) {
  if (actor.role === "guest_admin") {
    throw new HttpError(403, "FORBIDDEN", "You do not have permission to perform this action");
  }
  const employee = await loadActorEmployee(actor);
  const { prepared, warnings } = await validatePayload(body, employee);
  const leave = await prisma.$transaction(async (tx) => {
    const draft = await persistLeave(tx, {
      employeeId: employee.employeeId,
      leaveTypeId: body.leaveTypeId,
      reason: body.reason,
      prepared,
      reportingManagerEmployeeId: employee.managerId,
      status: "DRAFT",
      managerApprovalStatus: null,
    });
    return applySubmitTransitions(tx, draft, actor);
  });
  return toLeaveResponse(leave, warnings);
}

export async function updateDraft(actor: AuthTokenPayload, leaveId: number, body: UpdateLeaveDraftBody) {
  const leave = await assertCanReadLeave(leaveId, actor);
  if (leave.employeeId !== actor.employeeId) {
    throw new HttpError(403, "FORBIDDEN", "You do not have permission to perform this action");
  }
  if (leave.status !== "DRAFT") {
    throw new HttpError(409, "LEAVE_INVALID_TRANSITION", "Only draft applications can be edited");
  }
  const employee = await loadActorEmployee(actor);
  const merged: LeaveApplicationBody = {
    leaveTypeId: body.leaveTypeId ?? leave.leaveTypeId,
    reason: body.reason ?? leave.reason,
    selectedDates:
      body.selectedDates ??
      leave.dateSelections.map((row) => ({
        date: toCivilDate(row.leaveDate)!,
        session: row.session as DateSelectionInput["session"],
      })),
  };
  const { prepared, warnings } = await validatePayload(merged, employee, leaveId);
  const updated = await prisma.$transaction((tx) =>
    persistLeave(tx, {
      leaveId,
      employeeId: employee.employeeId,
      leaveTypeId: merged.leaveTypeId,
      reason: merged.reason,
      prepared,
      reportingManagerEmployeeId: employee.managerId,
      status: "DRAFT",
      managerApprovalStatus: null,
    }),
  );
  return toLeaveResponse(updated, warnings);
}

export async function submitDraft(actor: AuthTokenPayload, leaveId: number) {
  const leave = await assertCanReadLeave(leaveId, actor);
  if (leave.employeeId !== actor.employeeId) {
    throw new HttpError(403, "FORBIDDEN", "You do not have permission to perform this action");
  }
  if (leave.status !== "DRAFT") {
    throw new HttpError(409, "LEAVE_INVALID_TRANSITION", "Only draft applications can be submitted");
  }
  const employee = await loadActorEmployee(actor);
  const body: LeaveApplicationBody = {
    leaveTypeId: leave.leaveTypeId,
    reason: leave.reason,
    selectedDates: leave.dateSelections.map((row) => ({
      date: toCivilDate(row.leaveDate)!,
      session: row.session as DateSelectionInput["session"],
    })),
  };
  const { prepared, warnings } = await validatePayload(body, employee, leaveId);
  const submitted = await prisma.$transaction(async (tx) => {
    const updated = await persistLeave(tx, {
      leaveId,
      employeeId: employee.employeeId,
      leaveTypeId: body.leaveTypeId,
      reason: body.reason,
      prepared,
      reportingManagerEmployeeId: employee.managerId,
      status: "DRAFT",
      managerApprovalStatus: null,
    });
    return applySubmitTransitions(tx, updated, actor);
  });
  return toLeaveResponse(submitted, warnings);
}

export async function listLeaves(actor: AuthTokenPayload, query: ListLeavesQuery) {
  let employeeId = query.employeeId;
  if (actor.role === "employee") {
    employeeId = actor.employeeId;
  } else if (query.employeeId === undefined && actor.role !== "admin" && actor.role !== "guest_admin") {
    employeeId = actor.employeeId;
  }

  const { rows, total } = await leaveRepository.findManyLeaves({
    employeeId,
    status: query.status,
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  });

  const visible = rows.filter((row) => canReadLeave(row, actor));
  return {
    items: visible.map((row) => toLeaveResponse(row)),
    page: query.page,
    pageSize: query.pageSize,
    total: actor.role === "employee" ? total : visible.length === rows.length ? total : visible.length,
  };
}

export async function getLeave(actor: AuthTokenPayload, leaveId: number) {
  const leave = await assertCanReadLeave(leaveId, actor);
  return toLeaveResponse(leave);
}

export async function managerApprove(actor: AuthTokenPayload, leaveId: number, body: ReviewBody) {
  const leave = await leaveRepository.findLeaveById(leaveId);
  if (!leave) {
    throw new HttpError(404, "NOT_FOUND", "Leave application not found");
  }
  if (leave.reportingManagerEmployeeId !== actor.employeeId) {
    throw new HttpError(403, "FORBIDDEN", "You do not have permission to perform this action");
  }
  if (leave.status !== "SUBMITTED" || leave.managerApprovalStatus !== "PENDING") {
    throw new HttpError(409, "LEAVE_INVALID_TRANSITION", "Leave is not waiting for manager approval");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.leaveApplication.update({
      where: { leaveId },
      data: {
        status: "PENDING_HR_REVIEW",
        managerApprovalStatus: "APPROVED",
        managerReviewedAt: new Date(),
        managerComments: body.comment ?? null,
      },
      include: leaveRepository.leaveInclude,
    });
    await createStatusHistory(tx, {
      leaveId,
      changedById: actor.employeeId,
      oldStatus: "SUBMITTED",
      newStatus: "PENDING_HR_REVIEW",
      reason: body.comment ?? "MANAGER_APPROVED",
    });
    return next;
  });
  return toLeaveResponse(updated);
}

export async function managerReject(actor: AuthTokenPayload, leaveId: number, body: ReviewBody) {
  const leave = await leaveRepository.findLeaveById(leaveId);
  if (!leave) {
    throw new HttpError(404, "NOT_FOUND", "Leave application not found");
  }
  if (leave.reportingManagerEmployeeId !== actor.employeeId) {
    throw new HttpError(403, "FORBIDDEN", "You do not have permission to perform this action");
  }
  if (leave.status !== "SUBMITTED" || leave.managerApprovalStatus !== "PENDING") {
    throw new HttpError(409, "LEAVE_INVALID_TRANSITION", "Leave is not waiting for manager approval");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.leaveApplication.update({
      where: { leaveId },
      data: {
        status: "REJECTED",
        managerApprovalStatus: "REJECTED",
        managerReviewedAt: new Date(),
        managerComments: body.comment ?? null,
      },
      include: leaveRepository.leaveInclude,
    });
    await createStatusHistory(tx, {
      leaveId,
      changedById: actor.employeeId,
      oldStatus: "SUBMITTED",
      newStatus: "REJECTED",
      reason: body.comment ?? "MANAGER_REJECTED",
    });
    return next;
  });
  return toLeaveResponse(updated);
}

export async function hrApprove(actor: AuthTokenPayload, leaveId: number, body: ReviewBody) {
  if (actor.role !== "admin") {
    throw new HttpError(403, "FORBIDDEN", "You do not have permission to perform this action");
  }
  const leave = await leaveRepository.findLeaveById(leaveId);
  if (!leave) {
    throw new HttpError(404, "NOT_FOUND", "Leave application not found");
  }
  if (leave.employeeId === actor.employeeId) {
    throw new HttpError(403, "SELF_APPROVAL_FORBIDDEN", "HR/Admin cannot manually approve their own leave");
  }
  if (leave.status !== "PENDING_HR_REVIEW") {
    throw new HttpError(409, "LEAVE_INVALID_TRANSITION", "Leave is not pending HR review");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.leaveApplication.update({
      where: { leaveId },
      data: {
        status: "APPROVED",
        reviewedBy: actor.employeeId,
        reviewedAt: new Date(),
        hrComments: body.comment ?? null,
      },
      include: leaveRepository.leaveInclude,
    });
    await createStatusHistory(tx, {
      leaveId,
      changedById: actor.employeeId,
      oldStatus: "PENDING_HR_REVIEW",
      newStatus: "APPROVED",
      reason: body.comment ?? null,
    });
    return next;
  });
  return toLeaveResponse(updated);
}

export async function hrReject(actor: AuthTokenPayload, leaveId: number, body: ReviewBody) {
  if (actor.role !== "admin") {
    throw new HttpError(403, "FORBIDDEN", "You do not have permission to perform this action");
  }
  const leave = await leaveRepository.findLeaveById(leaveId);
  if (!leave) {
    throw new HttpError(404, "NOT_FOUND", "Leave application not found");
  }
  if (leave.employeeId === actor.employeeId) {
    throw new HttpError(403, "SELF_APPROVAL_FORBIDDEN", "HR/Admin cannot manually reject their own leave");
  }
  if (leave.status !== "PENDING_HR_REVIEW") {
    throw new HttpError(409, "LEAVE_INVALID_TRANSITION", "Leave is not pending HR review");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.leaveApplication.update({
      where: { leaveId },
      data: {
        status: "REJECTED",
        reviewedBy: actor.employeeId,
        reviewedAt: new Date(),
        hrComments: body.comment ?? null,
      },
      include: leaveRepository.leaveInclude,
    });
    await createStatusHistory(tx, {
      leaveId,
      changedById: actor.employeeId,
      oldStatus: "PENDING_HR_REVIEW",
      newStatus: "REJECTED",
      reason: body.comment ?? null,
    });
    return next;
  });
  return toLeaveResponse(updated);
}

export async function withdraw(actor: AuthTokenPayload, leaveId: number) {
  const leave = await assertCanReadLeave(leaveId, actor);
  if (leave.employeeId !== actor.employeeId) {
    throw new HttpError(403, "FORBIDDEN", "You do not have permission to perform this action");
  }
  if (["WITHDRAWN", "CANCELLED", "REJECTED", "APPROVED"].includes(leave.status)) {
    throw new HttpError(409, "LEAVE_INVALID_TRANSITION", "This leave cannot be withdrawn");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.leaveApplication.update({
      where: { leaveId },
      data: { status: "WITHDRAWN" },
      include: leaveRepository.leaveInclude,
    });
    await createStatusHistory(tx, {
      leaveId,
      changedById: actor.employeeId,
      oldStatus: leave.status,
      newStatus: "WITHDRAWN",
    });
    return next;
  });
  return toLeaveResponse(updated);
}

export async function cancel(actor: AuthTokenPayload, leaveId: number) {
  const leave = await leaveRepository.findLeaveById(leaveId);
  if (!leave) {
    throw new HttpError(404, "NOT_FOUND", "Leave application not found");
  }
  const isOwner = leave.employeeId === actor.employeeId;
  if (!isOwner && actor.role !== "admin") {
    throw new HttpError(403, "FORBIDDEN", "You do not have permission to perform this action");
  }
  if (["CANCELLED", "WITHDRAWN"].includes(leave.status)) {
    throw new HttpError(409, "LEAVE_INVALID_TRANSITION", "This leave cannot be cancelled");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.leaveApplication.update({
      where: { leaveId },
      data: { status: "CANCELLED" },
      include: leaveRepository.leaveInclude,
    });
    await createStatusHistory(tx, {
      leaveId,
      changedById: actor.employeeId,
      oldStatus: leave.status,
      newStatus: "CANCELLED",
    });
    return next;
  });
  return toLeaveResponse(updated);
}
