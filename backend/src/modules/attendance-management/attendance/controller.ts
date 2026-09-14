import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { HttpError } from "../../shared/utils/http-error.js";
import * as attendanceService from "./service.js";
import type {
  ListAttendanceQuery,
  MyAttendanceQuery,
  UpdateAttendanceBody,
} from "./validation.js";

export const checkIn = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpError(
        401,
        "UNAUTHORIZED",
        "Authentication required",
      );
    }

    const result = await attendanceService.checkIn(
      req.user.employeeId,
    );

    res.status(200).json(result);
  },
);

export const checkOut = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpError(
        401,
        "UNAUTHORIZED",
        "Authentication required",
      );
    }

    const result = await attendanceService.checkOut(
      req.user.employeeId,
    );

    res.status(200).json(result);
  },
);

export const getMyDashboard = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpError(
        401,
        "UNAUTHORIZED",
        "Authentication required",
      );
    }

    const result = await attendanceService.getMyDashboard(
      req.user.employeeId,
    );

    res.status(200).json(result);
  },
);

export const getMyAttendance = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpError(
        401,
        "UNAUTHORIZED",
        "Authentication required",
      );
    }

    const query = (res.locals.query ?? {}) as MyAttendanceQuery;

    const result =
      await attendanceService.getMyAttendanceHistory(
        req.user.employeeId,
        query,
      );

    res.status(200).json(result);
  },
);

export const list = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const query = (res.locals.query ?? {}) as ListAttendanceQuery;

    const result =
      await attendanceService.listOrgAttendance(query);

    res.status(200).json(result);
  },
);

export const update = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpError(
        401,
        "UNAUTHORIZED",
        "Authentication required",
      );
    }

    const attendanceId = Number(res.locals.params.id);

    const result =
      await attendanceService.adminUpdateAttendance(
        attendanceId,
        req.body as UpdateAttendanceBody,
        req.user.employeeId,
      );

    res.status(200).json(result);
  },
);