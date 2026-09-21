import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { createAuditLog } from "../../shared/audit-logs/repository.js";
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
  await createAuditLog({
    userId: req.user!.employeeId,
    action: "LEAVE_TYPE_CREATE",
    entityType: "LeaveType",
    entityId: leaveType.leaveTypeId,
    newValue: {
      leaveTypeId: leaveType.leaveTypeId,
      name: leaveType.name,
      requiresMedicalDocument: leaveType.requiresMedicalDocument,
    },
  });
  res.status(201).json(leaveType);
});

export const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const leaveTypeId = Number(res.locals.params.id);
  const previous = await leaveTypeService.getLeaveType(leaveTypeId);
  const leaveType = await leaveTypeService.updateLeaveType(leaveTypeId, req.body as UpdateLeaveTypeBody);
  await createAuditLog({
    userId: req.user!.employeeId,
    action: "LEAVE_TYPE_UPDATE",
    entityType: "LeaveType",
    entityId: leaveType.leaveTypeId,
    oldValue: {
      leaveTypeId: previous.leaveTypeId,
      name: previous.name,
      obsolete: previous.obsolete,
    },
    newValue: {
      leaveTypeId: leaveType.leaveTypeId,
      name: leaveType.name,
      obsolete: leaveType.obsolete,
    },
  });
  res.status(200).json(leaveType);
});

export const remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const leaveTypeId = Number(res.locals.params.id);
  const leaveType = await leaveTypeService.deleteLeaveType(leaveTypeId);
  await createAuditLog({
    userId: req.user!.employeeId,
    action: "LEAVE_TYPE_DELETE",
    entityType: "LeaveType",
    entityId: leaveTypeId,
  });
  if (leaveType === null) {
    res.status(204).send();
    return;
  }
  res.status(200).json(leaveType);
});
