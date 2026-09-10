import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import * as leaveTypeService from "./service.js";
import type { CreateLeaveTypeBody, ListLeaveTypesQuery, UpdateLeaveTypeBody } from "./validation.js";

export const list = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await leaveTypeService.listLeaveTypes(res.locals.query as ListLeaveTypesQuery);
  res.status(200).json(result);
});

export const getById = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const leaveType = await leaveTypeService.getLeaveType(Number(res.locals.params.id));
  res.status(200).json(leaveType);
});

export const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const leaveType = await leaveTypeService.createLeaveType(req.body as CreateLeaveTypeBody);
  res.status(201).json(leaveType);
});

export const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const leaveType = await leaveTypeService.updateLeaveType(
    Number(res.locals.params.id),
    req.body as UpdateLeaveTypeBody,
  );
  res.status(200).json(leaveType);
});

export const remove = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const leaveType = await leaveTypeService.deleteLeaveType(Number(res.locals.params.id));
  if (leaveType === null) {
    res.status(204).send();
    return;
  }
  res.status(200).json(leaveType);
});
