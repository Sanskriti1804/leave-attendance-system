import type { AttendanceCorrection } from "../../../generated/prisma/client.js";

import { createAuditLog } from "../../shared/audit-logs/repository.js";
import { getOrganisationSettings } from "../../shared/organisation-settings/service.js";
import { fromCivilDate, toCivilDate } from "../../shared/utils/dates.js";
import { HttpError } from "../../shared/utils/http-error.js";
import type { AuthTokenPayload } from "../../shared/utils/security.js";

import * as attendanceRepository from "../attendance/repository.js";
import { calculateLateMinutes } from "../attendance/service.js";

import * as correctionRepository from "./repository.js";

import type { AttendanceCorrectionWithDetails } from "./repository.js";

import type {
  ApproveCorrectionBody,
  CreateCorrectionBody,
  ListCorrectionsQuery,
  RejectCorrectionBody,
} from "./validation.js";

/**
 * Converts an attendance correction record into
 * an API-safe response.
 *
 * All datetime values are returned as UTC ISO strings.
 */
export function toCorrectionResponse(
  record: AttendanceCorrectionWithDetails | AttendanceCorrection,
) {
  const withDetails = record as AttendanceCorrectionWithDetails;

  return {
    correctionId: record.correctionId,
    employeeId: record.employeeId,
    attendanceId: record.attendanceId,

    // UTC civil date: YYYY-MM-DD
    correctionDate: toCivilDate(record.correctionDate),

    correctionType: record.correctionType,

    // UTC ISO timestamps
    correctLoginTime: record.correctLoginTime
      ? record.correctLoginTime.toISOString()
      : null,

    correctLogoutTime: record.correctLogoutTime
      ? record.correctLogoutTime.toISOString()
      : null,

    reason: record.reason,
    supportingDocument: record.supportingDocument,
    status: record.status,
    reviewedBy: record.reviewedBy,
    hrComments: record.hrComments,

    createdAt: record.createdAt.toISOString(),

    reviewedAt: record.reviewedAt
      ? record.reviewedAt.toISOString()
      : null,

    ...(withDetails.employee
      ? {
          employee: withDetails.employee,
        }
      : {}),

    ...(withDetails.reviewer
      ? {
          reviewer: withDetails.reviewer,
        }
      : {}),

    ...(withDetails.attendance
      ? {
          attendance: {
            ...withDetails.attendance,

            attendanceDate: toCivilDate(
              withDetails.attendance.attendanceDate,
            ),

            checkIn: withDetails.attendance.checkIn
              ? withDetails.attendance.checkIn.toISOString()
              : null,

            checkOut: withDetails.attendance.checkOut
              ? withDetails.attendance.checkOut.toISOString()
              : null,
          },
        }
      : {}),
  };
}

/**
 * Creates a new attendance correction request.
 *
 * Correction dates and corrected timestamps are handled in UTC.
 */
export async function createCorrection(
  employeeId: number,
  body: CreateCorrectionBody,
) {
  const correctionDateObj = fromCivilDate(body.correctionDate);

  /**
   * Prevent multiple pending correction requests
   * for the same employee and UTC attendance date.
   */
  const existingPending =
    await correctionRepository.findPendingCorrectionForDate(
      employeeId,
      correctionDateObj,
    );

  if (existingPending) {
    throw new HttpError(
      409,
      "PENDING_CORRECTION_EXISTS",
      "A pending correction request already exists for this date",
    );
  }

  let attendanceRecord:
    | attendanceRepository.AttendanceWithEmployee
    | null = null;

  /**
   * If an attendanceId is provided, verify that the
   * attendance record belongs to the requesting employee.
   */
  if (body.attendanceId) {
    attendanceRecord = await attendanceRepository.findById(
      body.attendanceId,
    );

    if (
      !attendanceRecord ||
      attendanceRecord.employeeId !== employeeId
    ) {
      throw new HttpError(
        404,
        "NOT_FOUND",
        "Attendance record not found or does not belong to you",
      );
    }

    /**
     * Make sure the supplied attendance record belongs
     * to the requested correction date.
     */
    if (
      toCivilDate(attendanceRecord.attendanceDate) !==
      body.correctionDate
    ) {
      throw new HttpError(
        400,
        "DATE_MISMATCH",
        "Attendance record does not belong to the correction date",
      );
    }
  } else {
    /**
     * Find an existing attendance record for the UTC date.
     */
    const found =
      await attendanceRepository.findByEmployeeAndDate(
        employeeId,
        correctionDateObj,
      );

    if (found) {
      attendanceRecord = found;
    } else {
      /**
       * If no attendance record exists, create one so that
       * the correction request can reference it.
       */
      attendanceRecord =
        await attendanceRepository.createAttendance({
          employeeId,
          attendanceDate: correctionDateObj,
          status: "Missing Check-In",
          lateMinutes: 0,
        });
    }
  }

  /**
   * Validate corrected login/logout ordering when both
   * timestamps are supplied.
   */
  const correctLoginTime = body.correctLoginTime
    ? new Date(body.correctLoginTime)
    : null;

  const correctLogoutTime = body.correctLogoutTime
    ? new Date(body.correctLogoutTime)
    : null;

  if (
    correctLoginTime &&
    correctLogoutTime &&
    correctLogoutTime <= correctLoginTime
  ) {
    throw new HttpError(
      400,
      "INVALID_TIME_RANGE",
      "Correct logout time must be after correct login time",
    );
  }

  const created = await correctionRepository.createCorrection({
    employeeId,
    attendanceId: attendanceRecord.attendanceId,
    correctionDate: correctionDateObj,
    correctionType: body.correctionType,
    correctLoginTime,
    correctLogoutTime,
    reason: body.reason,
    supportingDocument: body.supportingDocument ?? null,
    status: "PENDING",
  });

  const fullRecord = await correctionRepository.findById(
    created.correctionId,
  );

  return toCorrectionResponse(fullRecord ?? created);
}

/**
 * Lists correction requests.
 *
 * Employees can only see their own requests.
 * Admin/Guest Admin can filter by employee.
 */
export async function listCorrections(
  user: AuthTokenPayload,
  query: ListCorrectionsQuery,
) {
  const isEmployeeOnly = user.role === "employee";

  const filterEmployeeId = isEmployeeOnly
    ? user.employeeId
    : query.employeeId;

  const { rows, total } =
    await correctionRepository.findManyCorrections({
      employeeId: filterEmployeeId,
      status: query.status,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

  return {
    items: rows.map(toCorrectionResponse),
    page: query.page,
    pageSize: query.pageSize,
    total,
  };
}

/**
 * Gets a correction request by ID.
 *
 * Employees can only view their own requests.
 */
export async function getCorrectionById(
  user: AuthTokenPayload,
  correctionId: number,
) {
  const correction =
    await correctionRepository.findById(correctionId);

  if (!correction) {
    throw new HttpError(
      404,
      "NOT_FOUND",
      "Correction request not found",
    );
  }

  if (
    user.role === "employee" &&
    correction.employeeId !== user.employeeId
  ) {
    throw new HttpError(
      403,
      "FORBIDDEN",
      "You do not have permission to view this correction request",
    );
  }

  return toCorrectionResponse(correction);
}

/**
 * Approves an attendance correction request.
 *
 * Admins cannot approve their own correction requests.
 * Approval updates the related attendance record and
 * creates an audit log.
 */
export async function approveCorrection(
  adminUserId: number,
  correctionId: number,
  body: ApproveCorrectionBody,
) {
  const correction =
    await correctionRepository.findById(correctionId);

  if (!correction) {
    throw new HttpError(
      404,
      "NOT_FOUND",
      "Correction request not found",
    );
  }

  /**
   * Prevent self-approval.
   */
  if (correction.employeeId === adminUserId) {
    throw new HttpError(
      403,
      "SELF_APPROVAL_FORBIDDEN",
      "Admins cannot approve their own attendance correction requests",
    );
  }

  /**
   * Only PENDING corrections can be approved.
   */
  if (correction.status !== "PENDING") {
    throw new HttpError(
      409,
      "INVALID_TRANSITION",
      `Cannot approve correction in ${correction.status} status`,
    );
  }

  const now = new Date();

  /**
   * Prepare attendance update.
   */
  const attendanceUpdateData: Parameters<
    typeof attendanceRepository.updateAttendance
  >[1] = {};

  if (correction.correctLoginTime) {
    attendanceUpdateData.checkIn =
      correction.correctLoginTime;

    const settings = await getOrganisationSettings();

    /**
     * Late minutes are calculated using UTC check-in time.
     */
    attendanceUpdateData.lateMinutes =
      calculateLateMinutes(
        correction.correctLoginTime,
        settings.workStart,
        settings.graceMinutes,
      );
  }

  if (correction.correctLogoutTime) {
    attendanceUpdateData.checkOut =
      correction.correctLogoutTime;
  }

  /**
   * A successfully corrected attendance record is
   * considered Present.
   */
  attendanceUpdateData.status = "Present";

  await attendanceRepository.updateAttendance(
    correction.attendanceId,
    attendanceUpdateData,
  );

  /**
   * Mark correction request as approved.
   */
  const updatedCorrection =
    await correctionRepository.updateCorrection(
      correctionId,
      {
        status: "APPROVED",
        reviewedBy: adminUserId,
        reviewedAt: now,
        hrComments: body.hrComments ?? null,
      },
    );

  /**
   * Record the approval in the audit log.
   */
  await createAuditLog({
    userId: adminUserId,
    action: "ATTENDANCE_CORRECTION_APPROVED",
    entityType: "AttendanceCorrection",
    entityId: correctionId,

    oldValue: {
      status: "PENDING",
    },

    newValue: {
      status: "APPROVED",
      attendanceId: correction.attendanceId,
      correctLoginTime:
        correction.correctLoginTime?.toISOString() ?? null,
      correctLogoutTime:
        correction.correctLogoutTime?.toISOString() ?? null,
      hrComments: body.hrComments ?? null,
    },
  });

  const fullRecord =
    await correctionRepository.findById(
      updatedCorrection.correctionId,
    );

  return toCorrectionResponse(
    fullRecord ?? updatedCorrection,
  );
}

/**
 * Rejects an attendance correction request.
 *
 * Rejection does not modify the attendance record.
 * The action is recorded in the audit log.
 */
export async function rejectCorrection(
  adminUserId: number,
  correctionId: number,
  body: RejectCorrectionBody,
) {
  const correction =
    await correctionRepository.findById(correctionId);

  if (!correction) {
    throw new HttpError(
      404,
      "NOT_FOUND",
      "Correction request not found",
    );
  }

  /**
   * Only PENDING corrections can be rejected.
   */
  if (correction.status !== "PENDING") {
    throw new HttpError(
      409,
      "INVALID_TRANSITION",
      `Cannot reject correction in ${correction.status} status`,
    );
  }

  const now = new Date();

  /**
   * Mark correction request as rejected.
   */
  const updatedCorrection =
    await correctionRepository.updateCorrection(
      correctionId,
      {
        status: "REJECTED",
        reviewedBy: adminUserId,
        reviewedAt: now,
        hrComments: body.hrComments,
      },
    );

  /**
   * Record the rejection in the audit log.
   */
  await createAuditLog({
    userId: adminUserId,
    action: "ATTENDANCE_CORRECTION_REJECTED",
    entityType: "AttendanceCorrection",
    entityId: correctionId,

    oldValue: {
      status: "PENDING",
    },

    newValue: {
      status: "REJECTED",
      hrComments: body.hrComments,
    },
  });

  const fullRecord =
    await correctionRepository.findById(
      updatedCorrection.correctionId,
    );

  return toCorrectionResponse(
    fullRecord ?? updatedCorrection,
  );
}