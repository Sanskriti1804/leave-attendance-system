import { Platform } from "react-native";

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }
  return "http://localhost:3000";
}

export function authPath(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `/api/v1/auth${suffix}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiRequestInit = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  let body: BodyInit | undefined;
  if (init.body !== undefined && init.body !== null) {
    if (typeof init.body === "string" || init.body instanceof FormData) {
      body = init.body as BodyInit;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(init.body);
    }
  }

  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers, body });
  } catch {
    throw new Error(
      `Cannot reach the API at ${getApiBaseUrl()}. Check EXPO_PUBLIC_API_URL and that the backend is running.`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const errObj =
      typeof parsed === "object" &&
      parsed !== null &&
      "error" in parsed &&
      typeof (parsed as { error: unknown }).error === "object" &&
      (parsed as { error: unknown }).error !== null
        ? (parsed as { error: { message?: unknown; code?: unknown } }).error
        : null;
    const nested = errObj?.message;
    const top =
      typeof parsed === "object" && parsed !== null && "message" in parsed
        ? (parsed as { message: unknown }).message
        : undefined;
    const message =
      nested != null ? String(nested) : top != null ? String(top) : `Request failed (${response.status})`;
    const code = typeof errObj?.code === "string" ? errObj.code : undefined;
    throw new ApiError(message, response.status, code);
  }

  return parsed as T;
}
