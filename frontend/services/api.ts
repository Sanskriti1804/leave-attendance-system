import { Platform } from "react-native";

const API_PREFIX = "/api/v1";

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

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function parseApiError(status: number, body: unknown): ApiError {
  const envelope = body as ApiErrorBody;
  const code = envelope?.error?.code ?? "REQUEST_FAILED";
  const message = envelope?.error?.message ?? `Request failed (${status})`;
  return new ApiError(status, code, message, envelope?.error?.details);
}

export type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  accessToken?: string | null;
  skipAuth?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (!options.skipAuth && options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
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
      parsed = { error: { code: "INVALID_JSON", message: text } };
    }
  }

  if (!response.ok) {
    throw parseApiError(response.status, parsed);
  }

  return parsed as T;
}

export function authPath(path: string): string {
  return `${API_PREFIX}/auth${path}`;
}
