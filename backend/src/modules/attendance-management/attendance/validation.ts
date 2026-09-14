import { z } from "zod";

export const attendanceStatuses = [
  "Present",
  "Absent",
  "On Leave",
  "Half-Day",
  "Holiday",
  "Weekly Off",
  "Missing Check-In",
  "Missing Check-Out",
] as const;

export const checkInBodySchema = z
  .object({
    note: z.string().max(255).optional(),
  })
  .optional();

export const checkOutBodySchema = z
  .object({
    note: z.string().max(255).optional(),
  })
  .optional();

export const attendanceIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listAttendanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),

  // UTC attendance date: YYYY-MM-DD
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD")
    .optional(),

  employeeId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
});

export const myAttendanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),

  // UTC month: YYYY-MM
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Format must be YYYY-MM")
    .optional(),

  // UTC attendance dates
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD")
    .optional(),

  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD")
    .optional(),
});

export const updateAttendanceBodySchema = z.object({
  // UTC ISO datetime
  // Example: 2026-09-07T09:30:00.000Z
  checkIn: z
    .iso
    .datetime()
    .refine(
      (value) => value.endsWith("Z"),
      "checkIn must be a UTC datetime ending with Z",
    )
    .nullable()
    .optional(),

  // UTC ISO datetime
  // Example: 2026-09-07T18:30:00.000Z
  checkOut: z
    .iso
    .datetime()
    .refine(
      (value) => value.endsWith("Z"),
      "checkOut must be a UTC datetime ending with Z",
    )
    .nullable()
    .optional(),

  status: z.enum(attendanceStatuses).optional(),

  lateMinutes: z.number().int().min(0).optional(),
});

export type CheckInBody = z.infer<typeof checkInBodySchema>;
export type CheckOutBody = z.infer<typeof checkOutBodySchema>;
export type ListAttendanceQuery = z.infer<
  typeof listAttendanceQuerySchema
>;
export type MyAttendanceQuery = z.infer<
  typeof myAttendanceQuerySchema
>;
export type UpdateAttendanceBody = z.infer<
  typeof updateAttendanceBodySchema
>;