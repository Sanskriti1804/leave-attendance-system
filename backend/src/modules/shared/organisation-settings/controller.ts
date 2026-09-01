import type { NextFunction, Request, Response } from "express";
import * as organisationSettingsService from "./service.js";
import type { UpdateOrganisationSettingsBody } from "./validation.js";

export async function get(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await organisationSettingsService.getOrganisationSettings();
    res.status(200).json(settings);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await organisationSettingsService.updateOrganisationSettings(
      req.body as UpdateOrganisationSettingsBody,
    );
    res.status(200).json(settings);
  } catch (err) {
    next(err);
  }
}
