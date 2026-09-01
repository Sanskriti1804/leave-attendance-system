import bcrypt from "bcrypt";
import { findDepartmentById } from "../departments/repository.js";
import { HttpError } from "../utils/http-error.js";
import { fromCivilDate, toCivilDate } from "../utils/dates.js";
import * as employeeRepository from "./repository.js";
import type { EmployeePublic } from "./repository.js";
import type { CreateEmployeeBody, ListEmployeesQuery, UpdateEmployeeBody } from "./validation.js";

const BCRYPT_ROUNDS = 10;

function toEmployeeResponse(employee: EmployeePublic) {
  return {
    employeeId: employee.employeeId,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    departmentId: employee.departmentId,
    role: employee.role,
    managerId: employee.managerId,
    joiningDate: toCivilDate(employee.joiningDate),
    createdAt: employee.createdAt.toISOString(),
    status: employee.status,
    obsolete: employee.obsolete,
  };
}

async function assertDepartmentExists(departmentId: number): Promise<void> {
  const department = await findDepartmentById(departmentId);
  if (!department || department.obsolete) {
    throw new HttpError(422, "VALIDATION_ERROR", "Department not found or is obsolete");
  }
}

async function assertManagerExists(managerId: number, employeeId?: number): Promise<void> {
  if (employeeId !== undefined && managerId === employeeId) {
    throw new HttpError(422, "VALIDATION_ERROR", "An employee cannot be their own manager");
  }
  const manager = await employeeRepository.findEmployeeById(managerId);
  if (!manager || manager.obsolete) {
    throw new HttpError(422, "VALIDATION_ERROR", "Manager not found or is obsolete");
  }
}

export async function listEmployees(query: ListEmployeesQuery) {
  const { rows, total } = await employeeRepository.findManyEmployees({
    departmentId: query.department,
    obsolete: query.isActive === undefined ? undefined : !query.isActive,
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  });
  return {
    items: rows.map(toEmployeeResponse),
    page: query.page,
    pageSize: query.pageSize,
    total,
  };
}

export async function getEmployee(employeeId: number) {
  const employee = await employeeRepository.findEmployeeById(employeeId);
  if (!employee) {
    throw new HttpError(404, "NOT_FOUND", "Employee not found");
  }
  return toEmployeeResponse(employee);
}

export async function createEmployee(body: CreateEmployeeBody) {
  const existing = await employeeRepository.findEmployeeByEmail(body.email);
  if (existing) {
    throw new HttpError(409, "EMAIL_IN_USE", "Email is already in use");
  }

  await assertDepartmentExists(body.departmentId);
  if (body.managerId != null) {
    await assertManagerExists(body.managerId);
  }

  const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
  const created = await employeeRepository.createEmployee({
    firstName: body.firstName,
    lastName: body.lastName ?? null,
    email: body.email,
    passwordHash,
    role: body.role,
    joiningDate: body.joiningDate ? fromCivilDate(body.joiningDate) : null,
    status: body.status ?? "ACTIVE",
    department: { connect: { departmentId: body.departmentId } },
    ...(body.managerId != null
      ? { manager: { connect: { employeeId: body.managerId } } }
      : {}),
  });
  return toEmployeeResponse(created);
}

export async function updateEmployee(employeeId: number, body: UpdateEmployeeBody) {
  await getEmployee(employeeId);

  if (body.email) {
    const existing = await employeeRepository.findEmployeeByEmail(body.email);
    if (existing && existing.employeeId !== employeeId) {
      throw new HttpError(409, "EMAIL_IN_USE", "Email is already in use");
    }
  }

  if (body.departmentId !== undefined) {
    await assertDepartmentExists(body.departmentId);
  }
  if (body.managerId != null) {
    await assertManagerExists(body.managerId, employeeId);
  }

  const passwordHash =
    body.password !== undefined ? await bcrypt.hash(body.password, BCRYPT_ROUNDS) : undefined;

  const data: Parameters<typeof employeeRepository.updateEmployee>[1] = {
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    role: body.role,
    status: body.status,
    obsolete: body.obsolete,
    passwordHash,
    joiningDate:
      body.joiningDate === undefined
        ? undefined
        : body.joiningDate === null
          ? null
          : fromCivilDate(body.joiningDate),
    department:
      body.departmentId === undefined
        ? undefined
        : { connect: { departmentId: body.departmentId } },
    manager:
      body.managerId === undefined
        ? undefined
        : body.managerId === null
          ? { disconnect: true }
          : { connect: { employeeId: body.managerId } },
  };

  const updated = await employeeRepository.updateEmployee(employeeId, data);
  return toEmployeeResponse(updated);
}
