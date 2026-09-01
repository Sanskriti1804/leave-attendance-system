import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../../../generated/prisma/client.js";
import { logger } from "../../../logger.js";
import { HttpError } from "../utils/http-error.js";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = err.meta?.target;
      const fields = Array.isArray(target) ? target.join(",") : String(target ?? "");
      const emailInUse = fields.toLowerCase().includes("email");
      res.status(409).json({
        error: {
          code: emailInUse ? "EMAIL_IN_USE" : "CONFLICT",
          message: emailInUse
            ? "Email is already in use"
            : "A record with this unique value already exists.",
        },
      });
      return;
    }
    if (err.code === "P2003") {
      res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Referenced record does not exist.",
        },
      });
      return;
    }
  }

  logger.error({ err }, "unhandled error");
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    },
  });
}

export function notFoundMiddleware(_req: Request, res: Response): void {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Not found" },
  });
}
