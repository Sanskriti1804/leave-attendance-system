import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
import { createAuditLog } from "../audit-logs/repository.js";
import * as employeeService from "./service.js";
import type { CreateEmployeeBody, ListEmployeesQuery, UpdateEmployeeBody } from "./validation.js";

export const list = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await employeeService.listEmployees(res.locals.query as ListEmployeesQuery);
  res.status(200).json(result);
});

export const getById = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const employee = await employeeService.getEmployee(Number(res.locals.params.id));
  res.status(200).json(employee);
});

export const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const employee = await employeeService.createEmployee(req.body as CreateEmployeeBody);
  await createAuditLog({
    userId: req.user!.employeeId,
    action: "EMPLOYEE_CREATE",
    entityType: "Employee",
    entityId: employee.employeeId,
    newValue: employee,
  });
  res.status(201).json(employee);
});

export const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const employeeId = Number(res.locals.params.id);
  const previous = await employeeService.getEmployee(employeeId);
  const employee = await employeeService.updateEmployee(employeeId, req.body as UpdateEmployeeBody);
  await createAuditLog({
    userId: req.user!.employeeId,
    action: "EMPLOYEE_UPDATE",
    entityType: "Employee",
    entityId: employee.employeeId,
    oldValue: previous,
    newValue: employee,
  });
  res.status(200).json(employee);
});
