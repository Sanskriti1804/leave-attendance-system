import { z } from "zod";

export const LEAVE_SESSIONS = ["FULL_DAY", "FIRST_HALF", "SECOND_HALF"] as const;
export const LEAVE_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "PENDING_HR_REVIEW",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "WITHDRAWN",
] as const;

const civilDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const leaveIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const dateSelectionSchema = z.object({
  date: civilDate,
  session: z.enum(LEAVE_SESSIONS),
});

export const leaveApplicationBodySchema = z.object({
  leaveTypeId: z.number().int().positive(),
  reason: z.string().trim().min(1),
  selectedDates: z.array(dateSelectionSchema).min(1),
});

export const updateLeaveDraftBodySchema = leaveApplicationBodySchema
  .partial()
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: "At least one field is required",
  });

export const listLeavesQuerySchema = z.object({
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
  status: z.enum(LEAVE_STATUSES).optional(),
  employeeId: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? undefined : Number(value)))
    .pipe(z.number().int().positive().optional()),
});

export const reviewBodySchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    comment: z.string().trim().min(1).optional(),
  }),
);

export type DateSelectionInput = z.infer<typeof dateSelectionSchema>;
export type LeaveApplicationBody = z.infer<typeof leaveApplicationBodySchema>;
export type UpdateLeaveDraftBody = z.infer<typeof updateLeaveDraftBodySchema>;
export type ListLeavesQuery = z.infer<typeof listLeavesQuerySchema>;
export type ReviewBody = z.infer<typeof reviewBodySchema>;
