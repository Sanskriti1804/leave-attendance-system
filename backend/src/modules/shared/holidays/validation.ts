import { z } from "zod";

const civilDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

export const holidayIdParamsSchema = idParam;

export const listHolidaysQuerySchema = z
  .object({
    from: civilDate.optional(),
    to: civilDate.optional(),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: "`from` must be on or before `to`",
    path: ["from"],
  });

export const createHolidayBodySchema = z.object({
  date: civilDate,
  name: z.string().trim().min(1).max(100),
});

export type ListHolidaysQuery = z.infer<typeof listHolidaysQuerySchema>;
export type CreateHolidayBody = z.infer<typeof createHolidayBodySchema>;
