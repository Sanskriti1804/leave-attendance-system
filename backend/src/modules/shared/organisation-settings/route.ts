import { Router } from "express";
import { validate } from "../middlewares/validation.middleware.js";
import * as organisationSettingsController from "./controller.js";
import { updateOrganisationSettingsBodySchema } from "./validation.js";

const router = Router();

router.get("/", organisationSettingsController.get);
router.patch(
  "/",
  validate({ body: updateOrganisationSettingsBodySchema }),
  organisationSettingsController.update,
);

export default router;
