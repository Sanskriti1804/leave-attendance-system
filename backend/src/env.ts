import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number.parseInt(process.env.PORT ?? "3000", 10),
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  jwtSecret:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production"
      ? (() => {
        throw new Error("JWT_SECRET environment variable is required in production");
      })()
      : "dev_jwt_secret_key_change_in_production_32chars_min!"),
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY ?? "15m",
  jwtRefreshExpiryDays: Number.parseInt(process.env.JWT_REFRESH_EXPIRY_DAYS ?? "7", 10),
  passwordPepper:
    process.env.PASSWORD_PEPPER ||
    (process.env.NODE_ENV === "production"
      ? (() => {
        throw new Error("PASSWORD_PEPPER environment variable is required in production");
      })()
      : "dev_server_side_pepper_secret_never_stored_in_db"),
  authRateLimitWindowMs: Number.parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? "900000", 10), // 15 mins
  authRateLimitMax: Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? "20", 10),
  appTimezone: process.env.APP_TIMEZONE ?? "America/New_York",
  leaveMaxAdvanceDays: Number.parseInt(process.env.LEAVE_MAX_ADVANCE_DAYS ?? "14", 10),

  // Email / SMTP settings
  emailFrom: process.env.EMAIL_FROM ?? "noreply@leave-attendance.local",
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT, 10) : undefined,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpSecure: process.env.SMTP_SECURE === "true",
};
