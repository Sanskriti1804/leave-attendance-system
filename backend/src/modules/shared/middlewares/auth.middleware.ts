import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { findEmployeeById } from "../employees/repository.js";
import { HttpError } from "../utils/http-error.js";
import { verifyAccessToken } from "../utils/security.js";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpError(401, "UNAUTHORIZED", "Authorization token is missing or malformed");
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new HttpError(401, "UNAUTHORIZED", "Authorization token is missing");
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new HttpError(401, "TOKEN_EXPIRED", "Access token has expired");
      }
      throw new HttpError(401, "INVALID_TOKEN", "Invalid access token");
    }

    // Verify employee still exists and is active in database
    const employee = await findEmployeeById(payload.employeeId);
    if (!employee || employee.obsolete || employee.status !== "ACTIVE") {
      throw new HttpError(401, "UNAUTHORIZED", "Account is inactive or does not exist");
    }

    req.user = {
      employeeId: employee.employeeId,
      email: employee.email,
      role: employee.role,
      departmentId: employee.departmentId,
      status: employee.status,
    };

    next();
  } catch (err) {
    next(err);
  }
}
