import type { NextFunction, Request, Response } from "express";
import * as employeeService from "./service.js";
import type { CreateEmployeeBody, ListEmployeesQuery, UpdateEmployeeBody } from "./validation.js";

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await employeeService.listEmployees(res.locals.query as ListEmployeesQuery);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employee = await employeeService.getEmployee(Number(res.locals.params.id));
    res.status(200).json(employee);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employee = await employeeService.createEmployee(req.body as CreateEmployeeBody);
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employee = await employeeService.updateEmployee(
      Number(res.locals.params.id),
      req.body as UpdateEmployeeBody,
    );
    res.status(200).json(employee);
  } catch (err) {
    next(err);
  }
}
