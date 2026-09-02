import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/async-handler.js";
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
  res.status(201).json(department);
});

export const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const department = await departmentService.updateDepartment(
    Number(res.locals.params.id),
    req.body as UpdateDepartmentBody,
  );
  res.status(200).json(department);
});
