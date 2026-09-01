import { z } from "zod";

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

export const departmentIdParamsSchema = idParam;

export const listDepartmentsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? 1 : Number(value)))
    .pipe(z.number().int().min(1)),
  pageSize: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? 20 : Number(value)))
    .pipe(z.number().int().min(1).max(100)),
  includeObsolete: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const createDepartmentBodySchema = z.object({
  departmentName: z.string().trim().min(1).max(50),
});

export const updateDepartmentBodySchema = z
  .object({
    departmentName: z.string().trim().min(1).max(50).optional(),
    obsolete: z.boolean().optional(),
  })
  .refine((body) => body.departmentName !== undefined || body.obsolete !== undefined, {
    message: "At least one field is required",
  });

export type ListDepartmentsQuery = z.infer<typeof listDepartmentsQuerySchema>;
export type CreateDepartmentBody = z.infer<typeof createDepartmentBodySchema>;
export type UpdateDepartmentBody = z.infer<typeof updateDepartmentBodySchema>;
