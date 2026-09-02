import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../../../generated/prisma/client.js";
import { logger } from "../../../logger.js";
import { HttpError } from "../utils/http-error.js";
import { ZodError } from "zod";

type ErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

function sendError(res: Response, statusCode: number, body: ErrorBody): void {
  const error: ErrorBody = { code: body.code, message: body.message };
  if (body.details !== undefined) {
    error.details = body.details;
  }
  res.status(statusCode).json({ error });
}

function isMalformedJson(err: unknown): boolean {
  return err instanceof SyntaxError && "body" in err;
}

function uniqueTarget(err: Prisma.PrismaClientKnownRequestError): string {
  const target = err.meta?.target;
  if (Array.isArray(target)) {
    return target.join(",");
  }
  return String(target ?? "");
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) {
    return;
  }

  if (err instanceof HttpError) {
    sendError(res, err.statusCode, {
      code: err.code,
      message: err.message,
      details: err.details,
    });
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, 422, {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (isMalformedJson(err)) {
    sendError(res, 400, {
      code: "INVALID_JSON",
      message: "Request body is not valid JSON",
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const emailInUse = uniqueTarget(err).toLowerCase().includes("email");
      sendError(res, 409, {
        code: emailInUse ? "EMAIL_IN_USE" : "CONFLICT",
        message: emailInUse
          ? "Email is already in use"
          : "A record with this unique value already exists.",
      });
      return;
    }
    if (err.code === "P2003") {
      sendError(res, 422, {
        code: "VALIDATION_ERROR",
        message: "Referenced record does not exist.",
      });
      return;
    }
    if (err.code === "P2025") {
      sendError(res, 404, {
        code: "NOT_FOUND",
        message: "Record not found",
      });
      return;
    }
  }

  logger.error({ err }, "unhandled error");
  sendError(res, 500, {
    code: "INTERNAL_ERROR",
    message: "Internal server error",
  });
}

export function notFoundMiddleware(_req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, "NOT_FOUND", "Not found"));
}
