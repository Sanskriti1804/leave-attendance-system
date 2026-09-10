import { z } from "zod";

export const EMPLOYEE_ROLES = ["employee", "admin", "guest_admin"] as const;
export const EMPLOYEE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export const EMPLOYEE_SEX = ["male", "female", "unspecified"] as const;

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

export const employeeIdParamsSchema = idParam;

export const listEmployeesQuerySchema = z.object({
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
  department: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? undefined : Number(value)))
    .pipe(z.number().int().positive().optional()),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});

export const createEmployeeBodySchema = z.object({
  firstName: z.string().trim().min(1).max(25),
  lastName: z.string().trim().min(1).max(25).optional().nullable(),
  email: z.string().trim().email().max(100),
  password: z.string().min(8).max(100),
  departmentId: z.number().int().positive(),
  role: z.enum(EMPLOYEE_ROLES),
  managerId: z.number().int().positive().optional().nullable(),
  joiningDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
  sex: z.enum(EMPLOYEE_SEX).optional().nullable(),
});

export const updateEmployeeBodySchema = z
  .object({
    firstName: z.string().trim().min(1).max(25).optional(),
    lastName: z.string().trim().min(1).max(25).optional().nullable(),
    email: z.string().trim().email().max(100).optional(),
    password: z.string().min(8).max(100).optional(),
    departmentId: z.number().int().positive().optional(),
    role: z.enum(EMPLOYEE_ROLES).optional(),
    managerId: z.number().int().positive().optional().nullable(),
    joiningDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
    status: z.enum(EMPLOYEE_STATUSES).optional(),
    obsolete: z.boolean().optional(),
    sex: z.enum(EMPLOYEE_SEX).optional().nullable(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: "At least one field is required",
  });

export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
export type CreateEmployeeBody = z.infer<typeof createEmployeeBodySchema>;
export type UpdateEmployeeBody = z.infer<typeof updateEmployeeBodySchema>;
