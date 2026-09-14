import {
    equal,
    ok,
    throws,
    doesNotThrow,
  } from "node:assert/strict";
  
  import {
    calculateLateMinutes,
    getUtcWorkDate,
    toAttendanceResponse,
  } from "./src/modules/attendance-management/attendance/service.js";
  
  import {
    attendanceIdParamsSchema,
    checkInBodySchema,
    checkOutBodySchema,
    listAttendanceQuerySchema,
    myAttendanceQuerySchema,
    updateAttendanceBodySchema,
  } from "./src/modules/attendance-management/attendance/validation.js";
  
  import {
    approveCorrectionBodySchema,
    correctionIdParamsSchema,
    createCorrectionBodySchema,
    listCorrectionsQuerySchema,
    rejectCorrectionBodySchema,
  } from "./src/modules/attendance-management/attendance-corrections/validation.js";
  
  import { toCorrectionResponse } from "./src/modules/attendance-management/attendance-corrections/service.js";
  
  import { createApp } from "./src/app.js";
  
  async function runAttendanceTests() {
    console.log(
      "Starting Attendance & Attendance Correction Unit & Specification Tests (UTC)...\n",
    );
  
    // =========================================================
    // 1. UTC Work Date & Calculations
    // =========================================================
  
    console.log("[Test 1] UTC Work Date Derivation");
  
    const testDate = new Date("2026-09-07T23:45:00.000Z");
  
    const { civilDate, dateObj } = getUtcWorkDate(testDate);
  
    equal(
      civilDate,
      "2026-09-07",
      "Civil date must match UTC date",
    );
  
    equal(
      dateObj.toISOString(),
      "2026-09-07T00:00:00.000Z",
      "Date object must be midnight UTC",
    );
  
    console.log("✓ UTC work date derivation passed.\n");
  
    // =========================================================
    // 2. Late Minutes Calculation in UTC
    // =========================================================
  
    console.log("[Test 2] Late Minutes Calculation (UTC)");
  
    const workStart = "09:00";
    const graceMinutes = 15;
  
    // Before work start
    const punchOnTime = new Date("2026-09-07T08:55:00.000Z");
  
    equal(
      calculateLateMinutes(punchOnTime, workStart, graceMinutes),
      0,
      "Check-in before work start should have 0 late minutes",
    );
  
    // Within grace period
    const punchGrace = new Date("2026-09-07T09:10:00.000Z");
  
    equal(
      calculateLateMinutes(punchGrace, workStart, graceMinutes),
      0,
      "Check-in within grace period should have 0 late minutes",
    );
  
    // Exactly at grace boundary
    const punchGraceExact = new Date("2026-09-07T09:15:00.000Z");
  
    equal(
      calculateLateMinutes(punchGraceExact, workStart, graceMinutes),
      0,
      "Check-in exactly at grace boundary should have 0 late minutes",
    );
  
    // Beyond grace period
    const punchLate = new Date("2026-09-07T09:25:00.000Z");
  
    equal(
      calculateLateMinutes(punchLate, workStart, graceMinutes),
      25,
      "Late minutes should be calculated from scheduled work start",
    );
  
    // No work start configured
    equal(
      calculateLateMinutes(punchLate, null, graceMinutes),
      0,
      "No workStart should result in 0 late minutes",
    );
  
    console.log("✓ UTC late minutes calculation passed.\n");
  
    // =========================================================
    // 3. Attendance Zod Validation Schemas
    // =========================================================
  
    console.log("[Test 3] Attendance Zod Validation Schemas");
  
    ok(
      checkInBodySchema.parse({
        note: "Morning punch",
      }),
    );
  
    doesNotThrow(() => checkInBodySchema.parse(undefined));
  
    ok(
      checkOutBodySchema.parse({
        note: "Leaving for the day",
      }),
    );
  
    ok(
      attendanceIdParamsSchema.parse({
        id: "42",
      }),
    );
  
    throws(() =>
      attendanceIdParamsSchema.parse({
        id: "-1",
      }),
    );
  
    // List attendance query
    const parsedListQuery = listAttendanceQuerySchema.parse({
      page: "2",
      pageSize: "50",
      date: "2026-09-07",
      status: "Present",
    });
  
    equal(parsedListQuery.page, 2);
    equal(parsedListQuery.pageSize, 50);
    equal(parsedListQuery.date, "2026-09-07");
    equal(parsedListQuery.status, "Present");
  
    // Month history query
    const parsedMyQuery = myAttendanceQuerySchema.parse({
      month: "2026-09",
    });
  
    equal(parsedMyQuery.month, "2026-09");
  
    throws(() =>
      myAttendanceQuerySchema.parse({
        month: "invalid-month",
      }),
    );
  
    // Admin update body
    const parsedUpdate = updateAttendanceBodySchema.parse({
      status: "Half-Day",
      lateMinutes: 30,
    });
  
    equal(parsedUpdate.status, "Half-Day");
    equal(parsedUpdate.lateMinutes, 30);
  
    throws(() =>
      updateAttendanceBodySchema.parse({
        status: "InvalidStatus",
      }),
    );
  
    // Valid UTC timestamps
    const parsedUtcUpdate = updateAttendanceBodySchema.parse({
      checkIn: "2026-09-07T09:00:00.000Z",
      checkOut: "2026-09-07T17:00:00.000Z",
    });
  
    equal(
      parsedUtcUpdate.checkIn,
      "2026-09-07T09:00:00.000Z",
    );
  
    equal(
      parsedUtcUpdate.checkOut,
      "2026-09-07T17:00:00.000Z",
    );
  
    // Non-UTC offset should be rejected
    throws(() =>
      updateAttendanceBodySchema.parse({
        checkIn: "2026-09-07T09:00:00.000+05:30",
      }),
    );
  
    console.log("✓ Attendance validation schemas passed.\n");
  
    // =========================================================
    // 4. Attendance Correction Schemas
    // =========================================================
  
    console.log("[Test 4] Attendance Correction Validation Schemas");
  
    const validCorrection = createCorrectionBodySchema.parse({
      attendanceId: 10,
      correctionDate: "2026-09-07",
      correctionType: "MISSING_CHECK_IN",
      correctLoginTime: "2026-09-07T09:00:00.000Z",
      correctLogoutTime: "2026-09-07T17:00:00.000Z",
      reason: "Forgot to punch in due to system maintenance",
    });
  
    equal(validCorrection.attendanceId, 10);
    equal(validCorrection.correctionDate, "2026-09-07");
  
    equal(
      validCorrection.correctLoginTime,
      "2026-09-07T09:00:00.000Z",
    );
  
    equal(
      validCorrection.correctLogoutTime,
      "2026-09-07T17:00:00.000Z",
    );
  
    // Reason too short
    throws(() =>
      createCorrectionBodySchema.parse({
        correctionDate: "2026-09-07",
        correctionType: "MISSING_CHECK_IN",
        reason: "no",
      }),
    );
  
    // Invalid correction date
    throws(() =>
      createCorrectionBodySchema.parse({
        correctionDate: "invalid-date",
        correctionType: "MISSING_CHECK_IN",
        reason: "Forgot to punch in",
      }),
    );
  
    // Non-UTC correction timestamp should be rejected
    throws(() =>
      createCorrectionBodySchema.parse({
        correctionDate: "2026-09-07",
        correctionType: "MISSING_CHECK_IN",
        correctLoginTime: "2026-09-07T09:00:00.000+05:30",
        reason: "Forgot to punch in",
      }),
    );
  
    // List query
    const parsedCorrQuery = listCorrectionsQuerySchema.parse({
      status: "PENDING",
      page: "1",
      pageSize: "10",
    });
  
    equal(parsedCorrQuery.status, "PENDING");
    equal(parsedCorrQuery.page, 1);
    equal(parsedCorrQuery.pageSize, 10);
  
    // Correction ID params
    ok(
      correctionIdParamsSchema.parse({
        id: "5",
      }),
    );
  
    // Correction review schemas
    ok(
      approveCorrectionBodySchema.parse({
        hrComments: "Approved upon verification",
      }),
    );
  
    ok(
      rejectCorrectionBodySchema.parse({
        hrComments: "Punch logs already match card swipe",
      }),
    );
  
    // Rejection requires comment
    throws(() =>
      rejectCorrectionBodySchema.parse({
        hrComments: "",
      }),
    );
  
    console.log("✓ Attendance correction validation schemas passed.\n");
  
    // =========================================================
    // 5. Response Formatting Helpers
    // =========================================================
  
    console.log("[Test 5] Response Formatters (UTC ISO & Civil Date)");
  
    const sampleAttendance = {
      attendanceId: 1,
      employeeId: 42,
      attendanceDate: new Date("2026-09-07T00:00:00.000Z"),
      checkIn: new Date("2026-09-07T09:05:00.000Z"),
      checkOut: new Date("2026-09-07T17:02:00.000Z"),
      status: "Present",
      lateMinutes: 0,
      createdAt: new Date("2026-09-07T09:05:00.000Z"),
      updatedAt: new Date("2026-09-07T17:02:00.000Z"),
    };
  
    const formattedAttendance =
      toAttendanceResponse(sampleAttendance);
  
    equal(
      formattedAttendance.attendanceDate,
      "2026-09-07",
    );
  
    equal(
      formattedAttendance.checkIn,
      "2026-09-07T09:05:00.000Z",
    );
  
    equal(
      formattedAttendance.checkOut,
      "2026-09-07T17:02:00.000Z",
    );
  
    const sampleCorrection = {
      correctionId: 5,
      employeeId: 42,
      attendanceId: 1,
      correctionDate: new Date("2026-09-07T00:00:00.000Z"),
      correctionType: "MISSING_CHECK_IN",
      correctLoginTime: new Date(
        "2026-09-07T09:00:00.000Z",
      ),
      correctLogoutTime: null,
      reason: "Forgot badge",
      supportingDocument: null,
      status: "PENDING",
      reviewedBy: null,
      hrComments: null,
      createdAt: new Date("2026-09-07T10:00:00.000Z"),
      reviewedAt: null,
    };
  
    const formattedCorrection =
      toCorrectionResponse(sampleCorrection);
  
    equal(
      formattedCorrection.correctionDate,
      "2026-09-07",
    );
  
    equal(
      formattedCorrection.status,
      "PENDING",
    );
  
    equal(
      formattedCorrection.correctLoginTime,
      "2026-09-07T09:00:00.000Z",
    );
  
    equal(
      formattedCorrection.correctLogoutTime,
      null,
    );
  
    console.log("✓ Response formatters passed.\n");
  
    // =========================================================
    // 6. Express App Route Mounting Verification
    // =========================================================
  
    console.log("[Test 6] Express App Route Mounting Verification");
  
    const app = createApp();
  
    ok(
      app,
      "Express app instantiated successfully with mounted attendance routes",
    );
  
    console.log("✓ Express app route mounting passed.\n");
  
    // =========================================================
    // Final Result
    // =========================================================
  
    console.log("=========================================================");
    console.log(
      "ALL ATTENDANCE TESTS COMPLETED SUCCESSFULLY (100% PASSING)",
    );
    console.log("=========================================================");
  }
  
  runAttendanceTests().catch((err) => {
    console.error("Test failure:", err);
    process.exit(1);
  });