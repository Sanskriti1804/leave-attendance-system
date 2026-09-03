import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import * as departmentController from "./controller.js";
import {
  createDepartmentBodySchema,
  departmentIdParamsSchema,
  listDepartmentsQuerySchema,
  updateDepartmentBodySchema,
} from "./validation.js";

const router = Router();

router.use(authenticate);

router.get("/", validate({ query: listDepartmentsQuerySchema }), departmentController.list);
router.post(
  "/",
  authorize("admin"),
  validate({ body: createDepartmentBodySchema }),
  departmentController.create,
);
router.get("/:id", validate({ params: departmentIdParamsSchema }), departmentController.getById);
router.patch(
  "/:id",
  authorize("admin"),
  validate({ params: departmentIdParamsSchema, body: updateDepartmentBodySchema }),
  departmentController.update,
);

export default router;
