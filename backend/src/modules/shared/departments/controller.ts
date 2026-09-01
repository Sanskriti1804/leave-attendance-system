import type { NextFunction, Request, Response } from "express";
import * as departmentService from "./service.js";
import type {
  CreateDepartmentBody,
  ListDepartmentsQuery,
  UpdateDepartmentBody,
} from "./validation.js";

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await departmentService.listDepartments(res.locals.query as ListDepartmentsQuery);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const department = await departmentService.getDepartment(Number(res.locals.params.id));
    res.status(200).json(department);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const department = await departmentService.createDepartment(req.body as CreateDepartmentBody);
    res.status(201).json(department);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const department = await departmentService.updateDepartment(
      Number(res.locals.params.id),
      req.body as UpdateDepartmentBody,
    );
    res.status(200).json(department);
  } catch (err) {
    next(err);
  }
}
