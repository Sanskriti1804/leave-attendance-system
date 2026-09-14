import { Router } from "express";

import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/role.middleware.js";
import { validate } from "../../shared/middlewares/validation.middleware.js";

import * as attendanceController from "./controller.js";

import {
  attendanceIdParamsSchema,
  checkInBodySchema,
  checkOutBodySchema,
  listAttendanceQuerySchema,
  myAttendanceQuerySchema,
  updateAttendanceBodySchema,
} from "./validation.js";

const router = Router();

/**
 * All attendance routes require authentication.
 */
router.use(authenticate);

/**
 * Employee / Admin / Guest Admin
 * Check in for the current UTC attendance date.
 */
router.post(
  "/check-in",
  validate({
    body: checkInBodySchema,
  }),
  attendanceController.checkIn,
);

/**
 * Employee / Admin / Guest Admin
 * Check out for the current UTC attendance date.
 */
router.post(
  "/check-out",
  validate({
    body: checkOutBodySchema,
  }),
  attendanceController.checkOut,
);

/**
 * Employee / Admin / Guest Admin
 * Get today's attendance dashboard.
 */
router.get(
  "/me/dashboard",
  attendanceController.getMyDashboard,
);

/**
 * Employee / Admin / Guest Admin
 * Get the authenticated employee's attendance history.
 */
router.get(
  "/me",
  validate({
    query: myAttendanceQuerySchema,
  }),
  attendanceController.getMyAttendance,
);

/**
 * Admin / Guest Admin
 * List organisation attendance records.
 */
router.get(
  "/",
  authorize("admin", "guest_admin"),
  validate({
    query: listAttendanceQuerySchema,
  }),
  attendanceController.list,
);

/**
 * Admin only
 * Directly edit an attendance record.
 *
 * Admin edits are audited in the service layer.
 */
router.patch(
  "/:id",
  authorize("admin"),
  validate({
    params: attendanceIdParamsSchema,
    body: updateAttendanceBodySchema,
  }),
  attendanceController.update,
);

export default router;