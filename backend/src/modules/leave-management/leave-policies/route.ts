import { Router } from "express";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { authorize } from "../../shared/middlewares/role.middleware.js";
import { validate } from "../../shared/middlewares/validation.middleware.js";
import * as leavePolicyController from "./controller.js";
import {
  createLeavePolicyBodySchema,
  leavePolicyIdParamsSchema,
  listLeavePoliciesQuerySchema,
  updateLeavePolicyBodySchema,
} from "./validation.js";

const router = Router();

router.use(authenticate);

router.get("/", validate({ query: listLeavePoliciesQuerySchema }), leavePolicyController.list);
router.post(
  "/",
  authorize("admin"),
  validate({ body: createLeavePolicyBodySchema }),
  leavePolicyController.create,
);
router.get("/:id", validate({ params: leavePolicyIdParamsSchema }), leavePolicyController.getById);
router.patch(
  "/:id",
  authorize("admin"),
  validate({ params: leavePolicyIdParamsSchema, body: updateLeavePolicyBodySchema }),
  leavePolicyController.update,
);

export default router;
