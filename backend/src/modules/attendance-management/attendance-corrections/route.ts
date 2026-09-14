import { Router } from "express";

import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/role.middleware.js";
import { validate } from "../../shared/middlewares/validation.middleware.js";

import * as correctionController from "./controller.js";

import {
  approveCorrectionBodySchema,
  correctionIdParamsSchema,
  createCorrectionBodySchema,
  listCorrectionsQuerySchema,
  rejectCorrectionBodySchema,
} from "./validation.js";

const router = Router();

/**
 * All attendance correction routes require authentication.
 */
router.use(authenticate);

/**
 * Create a correction request.
 *
 * Employees can submit correction requests.
 * The service determines the employee from req.user.
 */
 router.post(
  "/",
  authorize("employee"),
  validate({
    body: createCorrectionBodySchema,
  }),
  correctionController.create,
);

/**
 * List correction requests.
 *
 * Employees see their own requests.
 * Admin/Guest Admin can view organisation requests.
 */
router.get(
  "/",
  validate({
    query: listCorrectionsQuerySchema,
  }),
  correctionController.list,
);

/**
 * Get a correction request by ID.
 *
 * Employees can view their own requests.
 * Admin/Guest Admin can view organisation requests.
 */
router.get(
  "/:id",
  validate({
    params: correctionIdParamsSchema,
  }),
  correctionController.getById,
);

/**
 * Approve a correction request.
 *
 * Admin only.
 *
 * Self-approval is additionally blocked in the service layer.
 */
router.post(
  "/:id/approve",
  authorize("admin"),
  validate({
    params: correctionIdParamsSchema,
    body: approveCorrectionBodySchema,
  }),
  correctionController.approve,
);

/**
 * Reject a correction request.
 *
 * Admin only.
 */
router.post(
  "/:id/reject",
  authorize("admin"),
  validate({
    params: correctionIdParamsSchema,
    body: rejectCorrectionBodySchema,
  }),
  correctionController.reject,
);

export default router;