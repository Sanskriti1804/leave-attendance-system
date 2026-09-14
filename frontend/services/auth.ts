import { apiRequest, type ApiRequestInit } from "./api";

export type Credentials = {
  email: string;
  password: string;
};

export type AuthSession = {
  token: string;
  email: string;
  user?: unknown;
};

let currentSession: AuthSession | null = null;

/**
 * Placeholder authentication service.
 * Replace the body of these functions with your real API calls.
 */
export async function login(credentials: Credentials): Promise<AuthSession> {
  // TODO: Connect your authentication API here.
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (!credentials.email || !credentials.password) {
    throw new Error("Invalid credentials.");
  }

  // Mock success — swap for your backend response.
  currentSession = {
    token: "mock-token",
    email: credentials.email,
  };
  return currentSession;
}

/**
 * Developer bypass used by the Login screen Pass button.
 * Skips credential validation so you can navigate the app while wiring auth.
 * Remove or gate this before shipping to production.
 */
export async function passLogin(): Promise<AuthSession> {
  // TODO: Optionally hook a real "guest" / "dev" auth endpoint here.
  await new Promise((resolve) => setTimeout(resolve, 200));

  currentSession = {
    token: "dev-pass-token",
    email: "developer@local",
  };
  return currentSession;
}

export async function logout(): Promise<void> {
  // TODO: Connect your authentication API here.
  currentSession = null;
}

export async function getSession(): Promise<AuthSession | null> {
  return currentSession;
}

export async function authorizedRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const session = currentSession;
  const headers = new Headers(init.headers);
  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }
  return apiRequest<T>(path, { ...init, headers });
}
