import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../db/index.js";

const departmentPublicSelect = {
  departmentId: true,
  departmentName: true,
  obsolete: true,
} satisfies Prisma.DepartmentSelect;

export type DepartmentPublic = Prisma.DepartmentGetPayload<{ select: typeof departmentPublicSelect }>;

export type DepartmentListFilter = {
  includeObsolete: boolean;
  skip: number;
  take: number;
};

export async function findManyDepartments(
  filter: DepartmentListFilter,
): Promise<{ rows: DepartmentPublic[]; total: number }> {
  const where = filter.includeObsolete ? {} : { obsolete: false };
  const [rows, total] = await Promise.all([
    prisma.department.findMany({
      where,
      select: departmentPublicSelect,
      skip: filter.skip,
      take: filter.take,
      orderBy: { departmentId: "asc" },
    }),
    prisma.department.count({ where }),
  ]);
  return { rows, total };
}

export function findDepartmentById(departmentId: number): Promise<DepartmentPublic | null> {
  return prisma.department.findUnique({ where: { departmentId }, select: departmentPublicSelect });
}

export function createDepartment(departmentName: string): Promise<DepartmentPublic> {
  return prisma.department.create({ data: { departmentName }, select: departmentPublicSelect });
}

export function updateDepartment(
  departmentId: number,
  data: { departmentName?: string; obsolete?: boolean },
): Promise<DepartmentPublic> {
  return prisma.department.update({ where: { departmentId }, data, select: departmentPublicSelect });
}
