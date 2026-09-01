import { Router } from "express";
import { validate } from "../middlewares/validation.middleware.js";
import * as employeeController from "./controller.js";
import {
  createEmployeeBodySchema,
  employeeIdParamsSchema,
  listEmployeesQuerySchema,
  updateEmployeeBodySchema,
} from "./validation.js";

const router = Router();

router.get("/", validate({ query: listEmployeesQuerySchema }), employeeController.list);
router.post("/", validate({ body: createEmployeeBodySchema }), employeeController.create);
router.get("/:id", validate({ params: employeeIdParamsSchema }), employeeController.getById);
router.patch(
  "/:id",
  validate({ params: employeeIdParamsSchema, body: updateEmployeeBodySchema }),
  employeeController.update,
);

export default router;
