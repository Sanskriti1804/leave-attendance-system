import { z } from "zod";

const passwordComplexitySchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .max(100, { message: "Password must not exceed 100 characters" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one digit" })
  .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" });

export const loginBodySchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1, { message: "Refresh token is required" }),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: passwordComplexitySchema,
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: "Invalid email address" }),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1, { message: "Reset token is required" }),
  newPassword: passwordComplexitySchema,
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
