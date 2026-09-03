import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize, authorizeSelfOrRoles } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import * as employeeController from "./controller.js";
import {
  createEmployeeBodySchema,
  employeeIdParamsSchema,
  listEmployeesQuerySchema,
  updateEmployeeBodySchema,
} from "./validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize("admin", "guest_admin"),
  validate({ query: listEmployeesQuerySchema }),
  employeeController.list,
);
router.post(
  "/",
  authorize("admin"),
  validate({ body: createEmployeeBodySchema }),
  employeeController.create,
);
router.get(
  "/:id",
  validate({ params: employeeIdParamsSchema }),
  authorizeSelfOrRoles("admin", "guest_admin"),
  employeeController.getById,
);
router.patch(
  "/:id",
  authorize("admin"),
  validate({ params: employeeIdParamsSchema, body: updateEmployeeBodySchema }),
  employeeController.update,
);

export default router;
