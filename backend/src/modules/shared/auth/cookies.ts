import type { Request, Response } from "express";
import { env } from "../../../env.js";

export const ACCESS_COOKIE = "lams_access";
export const REFRESH_COOKIE = "lams_refresh";

function maxAgeSeconds(value: string, fallback: number): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return fallback;
  const amount = Number(match[1]);
  if (match[2] === "s") return amount;
  if (match[2] === "m") return amount * 60;
  if (match[2] === "h") return amount * 3600;
  return amount * 86400;
}

function cookieSuffix(maxAge: number): string {
  const secure = env.nodeEnv === "production" ? "; Secure" : "";
  return `HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) {
      const value = rest.join("=");
      return value ? decodeURIComponent(value) : undefined;
    }
  }
  return undefined;
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const accessAge = maxAgeSeconds(env.jwtAccessExpiry, 15 * 60);
  const refreshAge = env.jwtRefreshExpiryDays * 24 * 60 * 60;
  res.append(
    "Set-Cookie",
    `${ACCESS_COOKIE}=${encodeURIComponent(accessToken)}; Path=/; ${cookieSuffix(accessAge)}`,
  );
  res.append(
    "Set-Cookie",
    `${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}; Path=/api/v1/auth; ${cookieSuffix(refreshAge)}`,
  );
}

export function clearAuthCookies(res: Response): void {
  const secure = env.nodeEnv === "production" ? "; Secure" : "";
  res.append("Set-Cookie", `${ACCESS_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
  res.append("Set-Cookie", `${REFRESH_COOKIE}=; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}
