import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import { createAuditLog } from "../audit-logs/repository.js";
import * as departmentService from "./service.js";
import type {
  CreateDepartmentBody,
  ListDepartmentsQuery,
  UpdateDepartmentBody,
} from "./validation.js";

export const list = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await departmentService.listDepartments(res.locals.query as ListDepartmentsQuery);
  res.status(200).json(result);
});

export const getById = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const department = await departmentService.getDepartment(Number(res.locals.params.id));
  res.status(200).json(department);
});

export const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const department = await departmentService.createDepartment(req.body as CreateDepartmentBody);
  await createAuditLog({
    userId: req.user!.employeeId,
    action: "DEPARTMENT_CREATE",
    entityType: "Department",
    entityId: department.departmentId,
    newValue: department,
  });
  res.status(201).json(department);
});

export const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const departmentId = Number(res.locals.params.id);
  const previous = await departmentService.getDepartment(departmentId);
  const department = await departmentService.updateDepartment(
    departmentId,
    req.body as UpdateDepartmentBody,
  );
  await createAuditLog({
    userId: req.user!.employeeId,
    action: "DEPARTMENT_UPDATE",
    entityType: "Department",
    entityId: department.departmentId,
    oldValue: previous,
    newValue: department,
  });
  res.status(200).json(department);
});
