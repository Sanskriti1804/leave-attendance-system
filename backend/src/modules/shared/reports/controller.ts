import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import * as reportsService from "./service.js";
import type { ReportQuery, ReportSlug } from "./validation.js";

export const getBySlug = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const slug = (res.locals.params as { slug: ReportSlug }).slug;
  const query = res.locals.query as ReportQuery;
  const rendered = await reportsService.renderReport(slug, query);
  if (query.format === "json") {
    res.status(200).json(rendered.json);
    return;
  }
  res.setHeader("Content-Type", rendered.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${rendered.filename}"`);
  res.status(200).send(rendered.body);
});
