import type { NextFunction, Request, Response } from "express";
import * as authService from "./service.js";
import { clearAuthCookies, readCookie, REFRESH_COOKIE, setAuthCookies } from "./cookies.js";
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
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(200).json({ expiresIn: result.expiresIn, user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: bodyToken } = req.body as RefreshBody;
    const refreshToken = bodyToken || readCookie(req, REFRESH_COOKIE);
    if (!refreshToken) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Refresh token is missing" } });
      return;
    }
    const result = await authService.refreshSession(refreshToken);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(200).json({ expiresIn: result.expiresIn, user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.user!.employeeId;
    const refreshToken = (req.body as { refreshToken?: string })?.refreshToken || readCookie(req, REFRESH_COOKIE);
    await authService.logout(employeeId, refreshToken);
    clearAuthCookies(res);
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
