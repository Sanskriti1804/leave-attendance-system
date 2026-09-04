import { z } from "zod";

export const leavePolicyIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listLeavePoliciesQuerySchema = z.object({
  leaveTypeId: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? undefined : Number(value)))
    .pipe(z.number().int().positive().optional()),
  includeObsolete: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const createLeavePolicyBodySchema = z.object({
  leaveTypeId: z.number().int().positive(),
  medicalDocumentAfterDays: z.number().int().min(0).nullable().optional(),
  includeWeekends: z.boolean().optional(),
  includeHolidays: z.boolean().optional(),
  maxDays: z.number().positive().nullable().optional(),
});

export const updateLeavePolicyBodySchema = z
  .object({
    medicalDocumentAfterDays: z.number().int().min(0).nullable().optional(),
    includeWeekends: z.boolean().optional(),
    includeHolidays: z.boolean().optional(),
    maxDays: z.number().positive().nullable().optional(),
    obsolete: z.boolean().optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: "At least one field is required",
  });

export type CreateLeavePolicyBody = z.infer<typeof createLeavePolicyBodySchema>;
export type UpdateLeavePolicyBody = z.infer<typeof updateLeavePolicyBodySchema>;
export type ListLeavePoliciesQuery = z.infer<typeof listLeavePoliciesQuerySchema>;
