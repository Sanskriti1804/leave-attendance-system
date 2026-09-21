import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import * as notificationController from "./controller.js";
import { z } from "zod";

const notificationIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const router = Router();
router.use(authenticate);
router.get("/", notificationController.listMine);
router.post("/:id/read", validate({ params: notificationIdParamsSchema }), notificationController.markRead);

export default router;
