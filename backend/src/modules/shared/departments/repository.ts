import type { Department } from "../../../generated/prisma/client.js";
import { prisma } from "../db/index.js";

export type DepartmentListFilter = {
  includeObsolete: boolean;
  skip: number;
  take: number;
};

export async function findManyDepartments(
  filter: DepartmentListFilter,
): Promise<{ rows: Department[]; total: number }> {
  const where = filter.includeObsolete ? {} : { obsolete: false };
  const [rows, total] = await Promise.all([
    prisma.department.findMany({
      where,
      skip: filter.skip,
      take: filter.take,
      orderBy: { departmentId: "asc" },
    }),
    prisma.department.count({ where }),
  ]);
  return { rows, total };
}

export function findDepartmentById(departmentId: number): Promise<Department | null> {
  return prisma.department.findUnique({ where: { departmentId } });
}

export function createDepartment(departmentName: string): Promise<Department> {
  return prisma.department.create({ data: { departmentName } });
}

export function updateDepartment(
  departmentId: number,
  data: { departmentName?: string; obsolete?: boolean },
): Promise<Department> {
  return prisma.department.update({ where: { departmentId }, data });
}
