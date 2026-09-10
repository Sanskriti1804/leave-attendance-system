import type { Employee, Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../db/index.js";

const employeePublicSelect = {
  employeeId: true,
  firstName: true,
  lastName: true,
  email: true,
  departmentId: true,
  role: true,
  managerId: true,
  joiningDate: true,
  createdAt: true,
  status: true,
  obsolete: true,
  sex: true,
} satisfies Prisma.EmployeeSelect;

export type EmployeePublic = Prisma.EmployeeGetPayload<{ select: typeof employeePublicSelect }>;

export type EmployeeListFilter = {
  departmentId?: number;
  obsolete?: boolean;
  skip: number;
  take: number;
};

export async function findManyEmployees(
  filter: EmployeeListFilter,
): Promise<{ rows: EmployeePublic[]; total: number }> {
  const where: Prisma.EmployeeWhereInput = {};
  if (filter.departmentId !== undefined) {
    where.departmentId = filter.departmentId;
  }
  if (filter.obsolete !== undefined) {
    where.obsolete = filter.obsolete;
  }

  const [rows, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      select: employeePublicSelect,
      skip: filter.skip,
      take: filter.take,
      orderBy: { employeeId: "asc" },
    }),
    prisma.employee.count({ where }),
  ]);
  return { rows, total };
}

export function findEmployeeById(employeeId: number): Promise<EmployeePublic | null> {
  return prisma.employee.findUnique({
    where: { employeeId },
    select: employeePublicSelect,
  });
}

export function findEmployeeByEmail(email: string): Promise<Employee | null> {
  return prisma.employee.findUnique({ where: { email } });
}

export function createEmployee(data: Prisma.EmployeeCreateInput): Promise<EmployeePublic> {
  return prisma.employee.create({
    data,
    select: employeePublicSelect,
  });
}

export function updateEmployee(
  employeeId: number,
  data: Prisma.EmployeeUpdateInput,
): Promise<EmployeePublic> {
  return prisma.employee.update({
    where: { employeeId },
    data,
    select: employeePublicSelect,
  });
}
