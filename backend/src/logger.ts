import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['set-cookie']",
      "password",
      "currentPassword",
      "newPassword",
      "token",
      "refreshToken",
      "tokenHash",
      "passwordHash",
      "resetToken",
      "rawRefreshToken",
      "rawToken",
      "*.password",
      "*.currentPassword",
      "*.newPassword",
      "*.token",
      "*.refreshToken",
      "*.tokenHash",
      "*.passwordHash",
    ],
    censor: "[REDACTED]",
  },
});
