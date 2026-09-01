import { HttpError } from "../utils/http-error.js";
import * as departmentRepository from "./repository.js";
import type { CreateDepartmentBody, ListDepartmentsQuery, UpdateDepartmentBody } from "./validation.js";

export async function listDepartments(query: ListDepartmentsQuery) {
  const { rows, total } = await departmentRepository.findManyDepartments({
    includeObsolete: query.includeObsolete,
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  });
  return {
    items: rows,
    page: query.page,
    pageSize: query.pageSize,
    total,
  };
}

export async function getDepartment(departmentId: number) {
  const department = await departmentRepository.findDepartmentById(departmentId);
  if (!department) {
    throw new HttpError(404, "NOT_FOUND", "Department not found");
  }
  return department;
}

export function createDepartment(body: CreateDepartmentBody) {
  return departmentRepository.createDepartment(body.departmentName);
}

export async function updateDepartment(departmentId: number, body: UpdateDepartmentBody) {
  await getDepartment(departmentId);
  return departmentRepository.updateDepartment(departmentId, body);
}
