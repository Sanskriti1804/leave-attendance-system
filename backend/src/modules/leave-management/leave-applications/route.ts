import { Router } from "express";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { validate } from "../../shared/middlewares/validation.middleware.js";
import * as leaveStatusHistoryController from "../leave-status-history/controller.js";
import { leaveHistoryParamsSchema } from "../leave-status-history/validation.js";
import * as leaveApplicationController from "./controller.js";
import {
  leaveApplicationBodySchema,
  leaveIdParamsSchema,
  listLeavesQuerySchema,
  reviewBodySchema,
  updateLeaveDraftBodySchema,
} from "./validation.js";

const router = Router();

router.use(authenticate);

router.get("/", validate({ query: listLeavesQuerySchema }), leaveApplicationController.list);
router.post("/drafts", validate({ body: leaveApplicationBodySchema }), leaveApplicationController.createDraft);
router.post("/", validate({ body: leaveApplicationBodySchema }), leaveApplicationController.submitNew);
router.get("/:id/history", validate({ params: leaveHistoryParamsSchema }), leaveStatusHistoryController.list);
router.get("/:id", validate({ params: leaveIdParamsSchema }), leaveApplicationController.getById);
router.patch(
  "/:id",
  validate({ params: leaveIdParamsSchema, body: updateLeaveDraftBodySchema }),
  leaveApplicationController.updateDraft,
);
router.post("/:id/submit", validate({ params: leaveIdParamsSchema }), leaveApplicationController.submitDraft);
router.post(
  "/:id/manager-approve",
  validate({ params: leaveIdParamsSchema, body: reviewBodySchema }),
  leaveApplicationController.managerApprove,
);
router.post(
  "/:id/manager-reject",
  validate({ params: leaveIdParamsSchema, body: reviewBodySchema }),
  leaveApplicationController.managerReject,
);
router.post(
  "/:id/approve",
  validate({ params: leaveIdParamsSchema, body: reviewBodySchema }),
  leaveApplicationController.approve,
);
router.post(
  "/:id/reject",
  validate({ params: leaveIdParamsSchema, body: reviewBodySchema }),
  leaveApplicationController.reject,
);
router.post("/:id/withdraw", validate({ params: leaveIdParamsSchema }), leaveApplicationController.withdraw);
router.post("/:id/cancel", validate({ params: leaveIdParamsSchema }), leaveApplicationController.cancel);

export default router;
