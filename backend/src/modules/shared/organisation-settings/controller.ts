import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import * as organisationSettingsService from "./service.js";
import type { UpdateOrganisationSettingsBody } from "./validation.js";

export const get = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const settings = await organisationSettingsService.getOrganisationSettings();
  res.status(200).json(settings);
});

export const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const settings = await organisationSettingsService.updateOrganisationSettings(
    req.body as UpdateOrganisationSettingsBody,
  );
  res.status(200).json(settings);
});
