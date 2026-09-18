import { apiRequest, authPath, type ApiRequestInit } from "./api";

export type Credentials = {
  email: string;
  password: string;
};

export type AuthSession = {
  token: string;
  refreshToken?: string;
  email: string;
  user?: unknown;
};

const SESSION_KEY = "lams.auth.session";

let currentSession: AuthSession | null = readStoredSession();

function readStoredSession(): AuthSession | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession | null): void {
  currentSession = session;
  try {
    if (typeof localStorage === "undefined") return;
    if (!session) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Native runtimes without localStorage keep the in-memory session only.
  }
}

export async function login(credentials: Credentials): Promise<AuthSession> {
  if (!credentials.email || !credentials.password) {
    throw new Error("Invalid credentials.");
  }

  const result = await apiRequest<{
    accessToken: string;
    refreshToken?: string;
    user?: unknown;
  }>(authPath("/login"), {
    method: "POST",
    body: { email: credentials.email, password: credentials.password },
  });

  persistSession({
    token: result.accessToken,
    refreshToken: result.refreshToken,
    email: credentials.email,
    user: result.user,
  });
  return currentSession!;
}

/**
 * Developer bypass used by the Login screen Pass button.
 * Skips credential validation so you can navigate the app while wiring auth.
 * Remove or gate this before shipping to production.
 */
export async function passLogin(): Promise<AuthSession> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  persistSession({
    token: "dev-pass-token",
    email: "developer@local",
  });
  return currentSession!;
}

export async function logout(): Promise<void> {
  const session = currentSession;
  try {
    if (session?.token && session.token !== "dev-pass-token") {
      await authorizedRequest(authPath("/logout"), {
        method: "POST",
        body: session.refreshToken ? { refreshToken: session.refreshToken } : {},
      });
    }
  } catch {
    // Always clear the local session even if the server logout call fails.
  }
  persistSession(null);
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
