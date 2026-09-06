import { z } from "zod";
import { EMPLOYEE_SEX } from "../../shared/employees/validation.js";

export const LEAVE_TYPE_ALLOWED_SEX = EMPLOYEE_SEX;

export const leaveTypeIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listLeaveTypesQuerySchema = z.object({
  includeObsolete: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const createLeaveTypeBodySchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().max(500).optional().nullable(),
  requiresMedicalDocument: z.boolean().optional(),
  allowedSex: z.enum(LEAVE_TYPE_ALLOWED_SEX).optional().nullable(),
});

export const updateLeaveTypeBodySchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    description: z.string().trim().max(500).optional().nullable(),
    requiresMedicalDocument: z.boolean().optional(),
    allowedSex: z.enum(LEAVE_TYPE_ALLOWED_SEX).optional().nullable(),
    obsolete: z.boolean().optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: "At least one field is required",
  });

export type CreateLeaveTypeBody = z.infer<typeof createLeaveTypeBodySchema>;
export type UpdateLeaveTypeBody = z.infer<typeof updateLeaveTypeBodySchema>;
export type ListLeaveTypesQuery = z.infer<typeof listLeaveTypesQuerySchema>;
