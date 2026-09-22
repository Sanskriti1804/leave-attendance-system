import { z } from "zod";

export const REPORT_SLUGS = [
  "leave-employee",
  "leave-department",
  "leave-monthly",
  "leave-type",
  "leave-decisions",
  "attendance-daily",
  "attendance-monthly",
  "attendance-employee",
  "attendance-late",
  "attendance-missing-logout",
] as const;

export type ReportSlug = (typeof REPORT_SLUGS)[number];

export const reportParamsSchema = z.object({
  slug: z.enum(REPORT_SLUGS),
});

export const reportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  format: z.enum(["json", "csv", "xlsx", "pdf"]).optional().default("json"),
  employeeId: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? undefined : Number(value)))
    .pipe(z.number().int().positive().optional()),
  departmentId: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === "" ? undefined : Number(value)))
    .pipe(z.number().int().positive().optional()),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
