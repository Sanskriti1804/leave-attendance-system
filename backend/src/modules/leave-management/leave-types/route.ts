import { Router } from "express";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/role.middleware.js";
import { validate } from "../../shared/middlewares/validation.middleware.js";
import * as leaveTypeController from "./controller.js";
import {
  createLeaveTypeBodySchema,
  leaveTypeIdParamsSchema,
  listLeaveTypesQuerySchema,
  updateLeaveTypeBodySchema,
} from "./validation.js";

const router = Router();

router.use(authenticate);

router.get("/", validate({ query: listLeaveTypesQuerySchema }), leaveTypeController.list);
router.post(
  "/",
  authorize("admin"),
  validate({ body: createLeaveTypeBodySchema }),
  leaveTypeController.create,
);
router.get("/:id", validate({ params: leaveTypeIdParamsSchema }), leaveTypeController.getById);
router.patch(
  "/:id",
  authorize("admin"),
  validate({ params: leaveTypeIdParamsSchema, body: updateLeaveTypeBodySchema }),
  leaveTypeController.update,
);
router.delete(
  "/:id",
  authorize("admin"),
  validate({ params: leaveTypeIdParamsSchema }),
  leaveTypeController.remove,
);

export default router;
