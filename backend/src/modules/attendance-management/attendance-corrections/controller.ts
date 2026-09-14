import type { Request, Response } from "express";

import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { HttpError } from "../../shared/utils/http-error.js";

import * as correctionService from "./service.js";

import type {
  ApproveCorrectionBody,
  CreateCorrectionBody,
  ListCorrectionsQuery,
  RejectCorrectionBody,
} from "./validation.js";

/**
 * Create an attendance correction request.
 *
 * Accessible to authenticated employees.
 */
export const create = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpError(
        401,
        "UNAUTHORIZED",
        "Authentication required",
      );
    }

    const result = await correctionService.createCorrection(
      req.user.employeeId,
      req.body as CreateCorrectionBody,
    );

    res.status(201).json(result);
  },
);

/**
 * List attendance correction requests.
 *
 * Employees see their own requests.
 * Admin/Guest Admin can see organisation requests.
 */
export const list = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpError(
        401,
        "UNAUTHORIZED",
        "Authentication required",
      );
    }

    const query = (res.locals.query ?? {}) as ListCorrectionsQuery;

    const result = await correctionService.listCorrections(
      req.user,
      query,
    );

    res.status(200).json(result);
  },
);

/**
 * Get a correction request by ID.
 */
export const getById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpError(
        401,
        "UNAUTHORIZED",
        "Authentication required",
      );
    }

    const correctionId = Number(res.locals.params.id);

    const result = await correctionService.getCorrectionById(
      req.user,
      correctionId,
    );

    res.status(200).json(result);
  },
);

/**
 * Approve an attendance correction request.
 */
export const approve = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpError(
        401,
        "UNAUTHORIZED",
        "Authentication required",
      );
    }

    const correctionId = Number(res.locals.params.id);

    const result = await correctionService.approveCorrection(
      req.user.employeeId,
      correctionId,
      req.body as ApproveCorrectionBody,
    );

    res.status(200).json(result);
  },
);

/**
 * Reject an attendance correction request.
 */
export const reject = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpError(
        401,
        "UNAUTHORIZED",
        "Authentication required",
      );
    }

    const correctionId = Number(res.locals.params.id);

    const result = await correctionService.rejectCorrection(
      req.user.employeeId,
      correctionId,
      req.body as RejectCorrectionBody,
    );

    res.status(200).json(result);
  },
);