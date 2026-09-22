import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import * as reportsController from "./controller.js";
import { reportParamsSchema, reportQuerySchema } from "./validation.js";

const router = Router();
router.use(authenticate);
router.get(
  "/:slug",
  authorize("admin", "guest_admin"),
  validate({ params: reportParamsSchema, query: reportQuerySchema }),
  reportsController.getBySlug,
);

export default router;
