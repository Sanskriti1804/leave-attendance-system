import { z } from "zod";

export const listAuditLogsQuerySchema = z.object({
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
  entityType: z.string().trim().min(1).max(100).optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
