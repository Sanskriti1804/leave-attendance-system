import { Router } from "express";
import { validate } from "../middlewares/validation.middleware.js";
import * as holidayController from "./controller.js";
import {
  createHolidayBodySchema,
  holidayIdParamsSchema,
  listHolidaysQuerySchema,
} from "./validation.js";

const router = Router();

router.get("/", validate({ query: listHolidaysQuerySchema }), holidayController.list);
router.post("/", validate({ body: createHolidayBodySchema }), holidayController.create);
router.delete("/:id", validate({ params: holidayIdParamsSchema }), holidayController.remove);

export default router;
