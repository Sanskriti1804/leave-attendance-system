import { Router } from "express";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { validate } from "../../shared/middlewares/validation.middleware.js";
import * as leaveDocumentController from "./controller.js";
import { documentIdParamsSchema } from "./validation.js";

const router = Router();

router.use(authenticate);

router.post("/", leaveDocumentController.upload);
router.get("/:id", validate({ params: documentIdParamsSchema }), leaveDocumentController.download);

export default router;
