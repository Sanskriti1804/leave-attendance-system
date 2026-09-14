import { z } from "zod";

export const correctionStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;

export const createCorrectionBodySchema = z.object({
  attendanceId: z.coerce.number().int().positive().optional(),

  // UTC attendance date: YYYY-MM-DD
  correctionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),

  correctionType: z.string().min(1).max(50),

  // UTC ISO datetime
  correctLoginTime: z
    .iso
    .datetime()
    .refine(
      (value) => value.endsWith("Z"),
      "correctLoginTime must be a UTC datetime ending with Z",
    )
    .nullable()
    .optional(),

  // UTC ISO datetime
  correctLogoutTime: z
    .iso
    .datetime()
    .refine(
      (value) => value.endsWith("Z"),
      "correctLogoutTime must be a UTC datetime ending with Z",
    )
    .nullable()
    .optional(),

  reason: z
    .string()
    .min(3, "Reason must be at least 3 characters")
    .max(500),

  supportingDocument: z
    .string()
    .max(255)
    .nullable()
    .optional(),
});

export const listCorrectionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(correctionStatuses).optional(),
  employeeId: z.coerce.number().int().positive().optional(),
});

export const correctionIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const approveCorrectionBodySchema = z.object({
  hrComments: z.string().max(500).optional(),
});

export const rejectCorrectionBodySchema = z.object({
  hrComments: z
    .string()
    .min(1, "Rejection comments are required")
    .max(500),
});

export type CreateCorrectionBody = z.infer<
  typeof createCorrectionBodySchema
>;

export type ListCorrectionsQuery = z.infer<
  typeof listCorrectionsQuerySchema
>;

export type ApproveCorrectionBody = z.infer<
  typeof approveCorrectionBodySchema
>;

export type RejectCorrectionBody = z.infer<
  typeof rejectCorrectionBodySchema
>;