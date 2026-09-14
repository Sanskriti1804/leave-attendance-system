import type { Attendance } from "../../../generated/prisma/client.js";
import { createAuditLog } from "../../shared/audit-logs/repository.js";
import { getOrganisationSettings } from "../../shared/organisation-settings/service.js";
import { fromCivilDate, toCivilDate } from "../../shared/utils/dates.js";
import { HttpError } from "../../shared/utils/http-error.js";
import * as attendanceRepository from "./repository.js";
import type { AttendanceWithEmployee } from "./repository.js";
import type {
  ListAttendanceQuery,
  MyAttendanceQuery,
  UpdateAttendanceBody,
} from "./validation.js";

/**
 * Returns the current UTC date as:
 * - civilDate: YYYY-MM-DD
 * - dateObj: UTC Date representing midnight of that civil date
 */
export function getUtcWorkDate(
  date: Date = new Date(),
): { civilDate: string; dateObj: Date } {
  const civilDate = date.toISOString().slice(0, 10);
  const dateObj = fromCivilDate(civilDate);

  return {
    civilDate,
    dateObj,
  };
}

/**
 * Calculates late minutes using UTC check-in time.
 *
 * workStart must be in HH:mm format.
 * graceMinutes is added to the configured work start time.
 *
 * Example:
 * workStart = 09:00
 * graceMinutes = 15
 * checkIn = 09:20 UTC
 *
 * lateMinutes = 20
 */
export function calculateLateMinutes(
  checkIn: Date,
  workStart: string | null,
  graceMinutes = 0,
): number {
  if (!workStart) {
    return 0;
  }

  const [startHourStr, startMinStr] = workStart.split(":");

  const startHour = Number.parseInt(startHourStr, 10);
  const startMin = Number.parseInt(startMinStr, 10);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMin) ||
    startHour < 0 ||
    startHour > 23 ||
    startMin < 0 ||
    startMin > 59
  ) {
    return 0;
  }

  const workStartMinutes = startHour * 60 + startMin;

  const checkInMinutes =
    checkIn.getUTCHours() * 60 + checkIn.getUTCMinutes();

  const allowedThreshold = workStartMinutes + graceMinutes;

  if (checkInMinutes > allowedThreshold) {
    return checkInMinutes - workStartMinutes;
  }

  return 0;
}

/**
 * Converts a database Attendance record into the API response format.
 *
 * All dates/timestamps returned by this function are UTC.
 */
export function toAttendanceResponse(
  record: AttendanceWithEmployee | Attendance,
) {
  const withEmp = record as AttendanceWithEmployee;

  return {
    attendanceId: record.attendanceId,
    employeeId: record.employeeId,

    // attendanceDate is a UTC civil date.
    attendanceDate: toCivilDate(record.attendanceDate),

    // Date#toISOString() always returns UTC with Z suffix.
    checkIn: record.checkIn ? record.checkIn.toISOString() : null,
    checkOut: record.checkOut ? record.checkOut.toISOString() : null,

    status: record.status,
    lateMinutes: record.lateMinutes,

    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),

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
 * Attendance date is always derived from the current UTC date.
 * Check-in timestamp is stored as the current UTC instant.
 */
export async function checkIn(employeeId: number) {
  const now = new Date();

  const { dateObj } = getUtcWorkDate(now);

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

  const settings = await getOrganisationSettings();

  const lateMinutes = calculateLateMinutes(
    now,
    settings.workStart,
    settings.graceMinutes,
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
 * The attendance record is searched using today's UTC date.
 */
export async function checkOut(employeeId: number) {
  const now = new Date();

  const { dateObj } = getUtcWorkDate(now);

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
 * Returns the employee's attendance dashboard for the current UTC date.
 */
export async function getMyDashboard(employeeId: number) {
  const now = new Date();

  const { civilDate, dateObj } = getUtcWorkDate(now);

  const record =
    await attendanceRepository.findByEmployeeAndDate(
      employeeId,
      dateObj,
    );

  const checkedIn = Boolean(record?.checkIn);
  const checkedOut = Boolean(record?.checkOut);

  return {
    date: civilDate,
    timezone: "UTC",

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
 * - default: current UTC month
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

    // First day of current UTC month.
    startDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        1,
      ),
    );

    // Last day of current UTC month.
    endDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        0,
      ),
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
 * All incoming checkIn/checkOut values are required by validation
 * to be UTC ISO timestamps ending with Z.
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

  /**
   * Update check-in.
   *
   * The validation layer guarantees UTC timestamps.
   */
  if (body.checkIn !== undefined) {
    updateData.checkIn = body.checkIn
      ? new Date(body.checkIn)
      : null;
  }

  /**
   * Update check-out.
   *
   * The validation layer guarantees UTC timestamps.
   */
  if (body.checkOut !== undefined) {
    updateData.checkOut = body.checkOut
      ? new Date(body.checkOut)
      : null;
  }

  if (body.status !== undefined) {
    updateData.status = body.status;
  }

  /**
   * If lateMinutes is explicitly supplied, respect the admin value.
   *
   * Otherwise, if checkIn is being changed, recalculate it using
   * the organisation's UTC workStart and graceMinutes.
   */
  if (body.lateMinutes !== undefined) {
    updateData.lateMinutes = body.lateMinutes;
  } else if (body.checkIn) {
    const settings = await getOrganisationSettings();

    updateData.lateMinutes = calculateLateMinutes(
      new Date(body.checkIn),
      settings.workStart,
      settings.graceMinutes,
    );
  }

  const updated =
    await attendanceRepository.updateAttendance(
      attendanceId,
      updateData,
    );

  /**
   * Audit log for Admin attendance modification.
   */
  await createAuditLog({
    userId: adminUserId,
    action: "ATTENDANCE_ADMIN_EDIT",
    entityType: "Attendance",
    entityId: attendanceId,

    oldValue: {
      checkIn: existing.checkIn
        ? existing.checkIn.toISOString()
        : null,

      checkOut: existing.checkOut
        ? existing.checkOut.toISOString()
        : null,

      status: existing.status,
      lateMinutes: existing.lateMinutes,
    },

    newValue: {
      checkIn: updated.checkIn
        ? updated.checkIn.toISOString()
        : null,

      checkOut: updated.checkOut
        ? updated.checkOut.toISOString()
        : null,

      status: updated.status,
      lateMinutes: updated.lateMinutes,
    },
  });

  return toAttendanceResponse(updated);
}