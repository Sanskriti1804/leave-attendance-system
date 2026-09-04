import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import * as leaveApplicationService from "./service.js";
import type { LeaveApplicationBody, ListLeavesQuery, ReviewBody, UpdateLeaveDraftBody } from "./validation.js";

export const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await leaveApplicationService.listLeaves(
    req.user!,
    res.locals.query as ListLeavesQuery,
  );
  res.status(200).json(result);
});

export const getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const leave = await leaveApplicationService.getLeave(req.user!, Number(res.locals.params.id));
  res.status(200).json(leave);
});

export const createDraft = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const leave = await leaveApplicationService.createDraft(req.user!, req.body as LeaveApplicationBody);
  res.status(201).json(leave);
});

export const submitNew = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const leave = await leaveApplicationService.submitNew(req.user!, req.body as LeaveApplicationBody);
  res.status(201).json(leave);
});

export const updateDraft = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const leave = await leaveApplicationService.updateDraft(
    req.user!,
    Number(res.locals.params.id),
    req.body as UpdateLeaveDraftBody,
  );
  res.status(200).json(leave);
});

export const submitDraft = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const leave = await leaveApplicationService.submitDraft(req.user!, Number(res.locals.params.id));
  res.status(200).json(leave);
});

export const managerApprove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const leave = await leaveApplicationService.managerApprove(
    req.user!,
    Number(res.locals.params.id),
    (req.body ?? {}) as ReviewBody,
  );
  res.status(200).json(leave);
});

export const managerReject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const leave = await leaveApplicationService.managerReject(
    req.user!,
    Number(res.locals.params.id),
    (req.body ?? {}) as ReviewBody,
  );
  res.status(200).json(leave);
});

export const approve = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const leave = await leaveApplicationService.hrApprove(
    req.user!,
    Number(res.locals.params.id),
    (req.body ?? {}) as ReviewBody,
  );
  res.status(200).json(leave);
});

export const reject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const leave = await leaveApplicationService.hrReject(
    req.user!,
    Number(res.locals.params.id),
    (req.body ?? {}) as ReviewBody,
  );
  res.status(200).json(leave);
});

export const withdraw = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const leave = await leaveApplicationService.withdraw(req.user!, Number(res.locals.params.id));
  res.status(200).json(leave);
});

export const cancel = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const leave = await leaveApplicationService.cancel(req.user!, Number(res.locals.params.id));
  res.status(200).json(leave);
});
