import type { NextFunction, Request, Response } from "express";
import * as authService from "./service.js";
import type {
  ChangePasswordBody,
  ForgotPasswordBody,
  LoginBody,
  RefreshBody,
  ResetPasswordBody,
} from "./validation.js";

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body as LoginBody);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body as RefreshBody;
    const result = await authService.refreshSession(refreshToken);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.user!.employeeId;
    const refreshToken = (req.body as { refreshToken?: string })?.refreshToken;
    await authService.logout(employeeId, refreshToken);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.user!.employeeId;
    const user = await authService.getMe(employeeId);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const employeeId = req.user!.employeeId;
    const result = await authService.changePassword(employeeId, req.body as ChangePasswordBody);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.forgotPassword(req.body as ForgotPasswordBody);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.resetPassword(req.body as ResetPasswordBody);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
