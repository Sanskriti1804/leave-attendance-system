import { z } from "zod";

const timeHm = z.string().regex(/^\d{2}:\d{2}$/);

export const updateOrganisationSettingsBodySchema = z
  .object({
    timezone: z.string().trim().min(1).max(100).optional(),
    workStart: timeHm.optional(),
    workEnd: timeHm.optional(),
    graceMinutes: z.number().int().min(0).optional(),
    weeklyOffDow: z.array(z.number().int().min(1).max(7)).optional(),
    leaveCountExcludesWeekends: z.boolean().optional(),
    leaveCountExcludesHolidays: z.boolean().optional(),
    medicalDocOptional1To2Days: z.boolean().optional(),
    medicalDocExceedsDays: z.number().int().min(1).optional(),
    maxAdvanceDays: z.number().int().min(1).optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: "At least one field is required",
  });

export type UpdateOrganisationSettingsBody = z.infer<typeof updateOrganisationSettingsBodySchema>;
