import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
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
  res.status(201).json(employee);
});

export const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const employee = await employeeService.updateEmployee(
    Number(res.locals.params.id),
    req.body as UpdateEmployeeBody,
  );
  res.status(200).json(employee);
});
