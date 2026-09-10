import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import * as leavePolicyService from "./service.js";
import type { CreateLeavePolicyBody, ListLeavePoliciesQuery, UpdateLeavePolicyBody } from "./validation.js";

export const list = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await leavePolicyService.listLeavePolicies(res.locals.query as ListLeavePoliciesQuery);
  res.status(200).json(result);
});

export const getById = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const policy = await leavePolicyService.getLeavePolicy(Number(res.locals.params.id));
  res.status(200).json(policy);
});

export const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const policy = await leavePolicyService.createLeavePolicy(req.body as CreateLeavePolicyBody);
  res.status(201).json(policy);
});

export const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const policy = await leavePolicyService.updateLeavePolicy(
    Number(res.locals.params.id),
    req.body as UpdateLeavePolicyBody,
  );
  res.status(200).json(policy);
});
