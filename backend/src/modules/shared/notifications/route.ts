import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import * as notificationController from "./controller.js";

const router = Router();
router.use(authenticate);
router.get("/", notificationController.listMine);

export default router;
