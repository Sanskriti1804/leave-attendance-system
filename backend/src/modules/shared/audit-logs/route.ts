import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import * as auditController from "./controller.js";
import { listAuditLogsQuerySchema } from "./validation.js";

const router = Router();

router.use(authenticate);
router.get("/", authorize("admin"), validate({ query: listAuditLogsQuerySchema }), auditController.list);

export default router;
