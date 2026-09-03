import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import * as organisationSettingsController from "./controller.js";
import { updateOrganisationSettingsBodySchema } from "./validation.js";

const router = Router();

router.use(authenticate);

router.get("/", organisationSettingsController.get);
router.patch(
  "/",
  authorize("admin"),
  validate({ body: updateOrganisationSettingsBodySchema }),
  organisationSettingsController.update,
);

export default router;
