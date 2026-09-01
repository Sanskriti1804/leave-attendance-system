import { Router } from "express";
import { validate } from "../middlewares/validation.middleware.js";
import * as departmentController from "./controller.js";
import {
  createDepartmentBodySchema,
  departmentIdParamsSchema,
  listDepartmentsQuerySchema,
  updateDepartmentBodySchema,
} from "./validation.js";

const router = Router();

router.get("/", validate({ query: listDepartmentsQuerySchema }), departmentController.list);
router.post("/", validate({ body: createDepartmentBodySchema }), departmentController.create);
router.get("/:id", validate({ params: departmentIdParamsSchema }), departmentController.getById);
router.patch(
  "/:id",
  validate({ params: departmentIdParamsSchema, body: updateDepartmentBodySchema }),
  departmentController.update,
);

export default router;
