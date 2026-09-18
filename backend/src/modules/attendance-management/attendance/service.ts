import type { Attendance } from "../../../generated/prisma/client.js";
import { createAuditLog } from "../../shared/audit-logs/repository.js";
import { getOrganisationSettings } from "../../shared/organisation-settings/service.js";
import {
  fromCivilDate,
  toCivilDate,
  toIsoWithIstOffset,
  getWorkDate,
  calculateLateMinutes as datesCalculateLateMinutes,
  DEFAULT_TIMEZONE,
} from "../../shared/utils/dates.js";
import { HttpError } from "../../shared/utils/http-error.js";
import * as attendanceRepository from "./repository.js";
import type { AttendanceWithEmployee } from "./repository.js";
import type {
  ListAttendanceQuery,
  MyAttendanceQuery,
  UpdateAttendanceBody,
} from "./validation.js";

/**
 * Returns the work date in IST (or configured timezone) as:
 * - civilDate: YYYY-MM-DD
 * - dateObj: UTC Date representing midnight of that civil date
 */
export function getUtcWorkDate(
  date: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE,
): { civilDate: string; dateObj: Date } {
  return getWorkDate(date, timeZone);
}

/**
 * Calculates late minutes against a configured work start time (HH:mm)
 * evaluated in the organization's time zone (default Asia/Kolkata / IST).
 */
export function calculateLateMinutes(
  checkIn: Date,
  workStart: string | null,
  graceMinutes = 0,
  timeZone: string = DEFAULT_TIMEZONE,
): number {
  return datesCalculateLateMinutes(checkIn, workStart, graceMinutes, timeZone);
}

/**
 * Converts a database Attendance record into the API response format.
 *
 * Timestamps are stored in UTC and formatted with an IST (+05:30) offset.
 */
export function toAttendanceResponse(
  record: AttendanceWithEmployee | Attendance,
) {
  const withEmp = record as AttendanceWithEmployee;

  return {
    attendanceId: record.attendanceId,
    employeeId: record.employeeId,

    // attendanceDate is a civil date YYYY-MM-DD.
    attendanceDate: toCivilDate(record.attendanceDate),

    // Stored in UTC, formatted with IST offset (+05:30)
    checkIn: toIsoWithIstOffset(record.checkIn),
    checkOut: toIsoWithIstOffset(record.checkOut),

    status: record.status,
    lateMinutes: record.lateMinutes,

    createdAt: toIsoWithIstOffset(record.createdAt)!,
    updatedAt: toIsoWithIstOffset(record.updatedAt)!,

    ...(withEmp.employee
      ? {
          employee: withEmp.employee,
        }
      : {}),
  };
}

/**
 * Employee check-in.
 *
 * Attendance date is derived from the current work date in IST.
 * Check-in timestamp is stored in the database as UTC.
 */
export async function checkIn(employeeId: number) {
  const now = new Date();
  const settings = await getOrganisationSettings();
  const timeZone = settings.timezone || DEFAULT_TIMEZONE;

  const { dateObj } = getWorkDate(now, timeZone);

  const existing =
    await attendanceRepository.findByEmployeeAndDate(
      employeeId,
      dateObj,
    );

  if (existing?.checkIn) {
    throw new HttpError(
      409,
      "ALREADY_CHECKED_IN",
      "Employee has already checked in for today",
    );
  }

  const lateMinutes = calculateLateMinutes(
    now,
    settings.workStart,
    settings.graceMinutes,
    timeZone,
  );

  let record: Attendance;

  if (existing) {
    record = await attendanceRepository.updateAttendance(
      existing.attendanceId,
      {
        checkIn: now,
        status: "Present",
        lateMinutes,
      },
    );
  } else {
    record = await attendanceRepository.createAttendance({
      employeeId,
      attendanceDate: dateObj,
      checkIn: now,
      status: "Present",
      lateMinutes,
    });
  }

  return toAttendanceResponse(record);
}

/**
 * Employee check-out.
 *
 * The attendance record is searched using today's work date in IST.
 * Check-out timestamp is stored in the database as UTC.
 */
export async function checkOut(employeeId: number) {
  const now = new Date();
  const settings = await getOrganisationSettings();
  const timeZone = settings.timezone || DEFAULT_TIMEZONE;

  const { dateObj } = getWorkDate(now, timeZone);

  const existing =
    await attendanceRepository.findByEmployeeAndDate(
      employeeId,
      dateObj,
    );

  if (!existing?.checkIn) {
    throw new HttpError(
      400,
      "NO_CHECK_IN",
      "Employee has not checked in for today",
    );
  }

  if (existing.checkOut) {
    throw new HttpError(
      409,
      "ALREADY_CHECKED_OUT",
      "Employee has already checked out for today",
    );
  }

  const record = await attendanceRepository.updateAttendance(
    existing.attendanceId,
    {
      checkOut: now,
    },
  );

  return toAttendanceResponse(record);
}

/**
 * Returns the employee's attendance dashboard for the current work date in IST.
 */
export async function getMyDashboard(employeeId: number) {
  const now = new Date();
  const settings = await getOrganisationSettings();
  const timeZone = settings.timezone || DEFAULT_TIMEZONE;

  const { civilDate, dateObj } = getWorkDate(now, timeZone);

  const record =
    await attendanceRepository.findByEmployeeAndDate(
      employeeId,
      dateObj,
    );

  const checkedIn = Boolean(record?.checkIn);
  const checkedOut = Boolean(record?.checkOut);

  return {
    date: civilDate,
    timezone: timeZone,

    canCheckIn: !checkedIn,
    canCheckOut: checkedIn && !checkedOut,

    checkedIn,
    checkedOut,

    status: record?.status ?? "Not Marked",
    lateMinutes: record?.lateMinutes ?? 0,

    attendance: record
      ? toAttendanceResponse(record)
      : null,
  };
}

/**
 * Returns the employee's attendance history.
 *
 * Supported filters:
 * - startDate + endDate
 * - month
 * - default: current IST month
 */
export async function getMyAttendanceHistory(
  employeeId: number,
  query: MyAttendanceQuery,
) {
  let startDate: Date;
  let endDate: Date;

  if (query.startDate && query.endDate) {
    startDate = fromCivilDate(query.startDate);
    endDate = fromCivilDate(query.endDate);
  } else if (query.month) {
    const [yearStr, monthStr] = query.month.split("-");

    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10);

    // First day of month at UTC midnight.
    startDate = new Date(
      Date.UTC(year, month - 1, 1),
    );

    // Last day of month at UTC midnight.
    endDate = new Date(
      Date.UTC(year, month, 0),
    );
  } else {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: DEFAULT_TIMEZONE,
      year: "numeric",
      month: "numeric",
    }).formatToParts(now);

    const year = Number.parseInt(parts.find((p) => p.type === "year")?.value ?? "2026", 10);
    const month = Number.parseInt(parts.find((p) => p.type === "month")?.value ?? "1", 10);

    startDate = new Date(
      Date.UTC(year, month - 1, 1),
    );

    endDate = new Date(
      Date.UTC(year, month, 0),
    );
  }

  const { rows, total } =
    await attendanceRepository.findManyAttendance({
      employeeId,
      startDate,
      endDate,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

  const allMonthRecords =
    await attendanceRepository.findEmployeeAttendanceStats(
      employeeId,
      startDate,
      endDate,
    );

  let totalPresent = 0;
  let totalHalfDay = 0;
  let totalAbsent = 0;
  let totalOnLeave = 0;
  let totalLate = 0;

  for (const item of allMonthRecords) {
    if (item.status === "Present") {
      totalPresent++;
    } else if (item.status === "Half-Day") {
      totalHalfDay++;
    } else if (item.status === "Absent") {
      totalAbsent++;
    } else if (item.status === "On Leave") {
      totalOnLeave++;
    }

    if (item.lateMinutes > 0) {
      totalLate++;
    }
  }

  return {
    items: rows.map(toAttendanceResponse),

    summary: {
      totalPresent,
      totalHalfDay,
      totalAbsent,
      totalOnLeave,
      totalLate,
    },

    page: query.page,
    pageSize: query.pageSize,
    total,
  };
}

/**
 * Lists attendance records for the organisation.
 *
 * Used by Admin / Guest Admin.
 */
export async function listOrgAttendance(
  query: ListAttendanceQuery,
) {
  const filter: Parameters<
    typeof attendanceRepository.findManyAttendance
  >[0] = {
    employeeId: query.employeeId,
    departmentId: query.departmentId,
    status: query.status,

    // Convert YYYY-MM-DD into a UTC date.
    date: query.date
      ? fromCivilDate(query.date)
      : undefined,

    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  };

  const { rows, total } =
    await attendanceRepository.findManyAttendance(filter);

  return {
    items: rows.map(toAttendanceResponse),

    page: query.page,
    pageSize: query.pageSize,
    total,
  };
}

/**
 * Admin directly edits an attendance record.
 *
 * Every admin mutation is recorded in the AuditLog.
 */
export async function adminUpdateAttendance(
  attendanceId: number,
  body: UpdateAttendanceBody,
  adminUserId: number,
) {
  const existing =
    await attendanceRepository.findById(attendanceId);

  if (!existing) {
    throw new HttpError(
      404,
      "NOT_FOUND",
      "Attendance record not found",
    );
  }

  const updateData: Parameters<
    typeof attendanceRepository.updateAttendance
  >[1] = {};

  if (body.checkIn !== undefined) {
    updateData.checkIn = body.checkIn
      ? new Date(body.checkIn)
      : null;
  }

  if (body.checkOut !== undefined) {
    updateData.checkOut = body.checkOut
      ? new Date(body.checkOut)
      : null;
  }

  if (body.status !== undefined) {
    updateData.status = body.status;
  }

  if (body.lateMinutes !== undefined) {
    updateData.lateMinutes = body.lateMinutes;
  } else if (body.checkIn) {
    const settings = await getOrganisationSettings();
    const timeZone = settings.timezone || DEFAULT_TIMEZONE;

    updateData.lateMinutes = calculateLateMinutes(
      new Date(body.checkIn),
      settings.workStart,
      settings.graceMinutes,
      timeZone,
    );
  }

  const updated =
    await attendanceRepository.updateAttendance(
      attendanceId,
      updateData,
    );

  await createAuditLog({
    userId: adminUserId,
    action: "ATTENDANCE_ADMIN_EDIT",
    entityType: "Attendance",
    entityId: attendanceId,
    oldValue: {
      checkIn: toIsoWithIstOffset(existing.checkIn),
      checkOut: toIsoWithIstOffset(existing.checkOut),
      status: existing.status,
      lateMinutes: existing.lateMinutes,
    },
    newValue: {
      checkIn: toIsoWithIstOffset(updated.checkIn),
      checkOut: toIsoWithIstOffset(updated.checkOut),
      status: updated.status,
      lateMinutes: updated.lateMinutes,
    },
  });

  return toAttendanceResponse(updated);
}