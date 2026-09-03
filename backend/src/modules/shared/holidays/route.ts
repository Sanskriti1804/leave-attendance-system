import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import * as holidayController from "./controller.js";
import {
  createHolidayBodySchema,
  holidayIdParamsSchema,
  listHolidaysQuerySchema,
} from "./validation.js";

const router = Router();

router.use(authenticate);

router.get("/", validate({ query: listHolidaysQuerySchema }), holidayController.list);
router.post(
  "/",
  authorize("admin"),
  validate({ body: createHolidayBodySchema }),
  holidayController.create,
);
router.delete(
  "/:id",
  authorize("admin"),
  validate({ params: holidayIdParamsSchema }),
  holidayController.remove,
);

export default router;
