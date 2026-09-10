import { Router } from "express";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { validate } from "../../shared/middlewares/validation.middleware.js";
import * as leaveStatusHistoryController from "./controller.js";
import { leaveHistoryParamsSchema } from "./validation.js";

const router = Router();

router.use(authenticate);
router.get(
  "/:id/history",
  validate({ params: leaveHistoryParamsSchema }),
  leaveStatusHistoryController.list,
);

export default router;
