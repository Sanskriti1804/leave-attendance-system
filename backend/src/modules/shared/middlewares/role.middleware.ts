import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http-error.js";

/**
 * Ensures the authenticated user has one of the required roles.
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new HttpError(403, "FORBIDDEN", "You do not have permission to perform this action");
    }

    next();
  };
}

/**
 * Ensures the authenticated user is accessing their own resource (matching :id parameter)
 * OR possesses one of the allowed administrator roles.
 */
export function authorizeSelfOrRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
    }

    const paramId = Number(res.locals.params?.id ?? req.params.id);

    if (req.user.employeeId === paramId || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    throw new HttpError(403, "FORBIDDEN", "You do not have permission to perform this action");
  };
}
