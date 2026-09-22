import { apiRequest, authPath, ApiError, type ApiRequestInit } from "./api";

export type Credentials = {
  email: string;
  password: string;
};

export type AuthSession = {
  token: string;
  refreshToken?: string;
  email: string;
  user?: unknown;
  persist?: boolean;
};

const SESSION_KEY = "lams.auth.session";
const NATIVE_SESSION_FILE = "lams.auth.session.json";

let currentSession: AuthSession | null = readWebSession();
let hydrateDone = false;
let hydratePromise: Promise<void> | null = null;
let refreshInFlight: Promise<boolean> | null = null;

function canUseStorage(kind: "localStorage" | "sessionStorage"): boolean {
  try {
    return typeof globalThis[kind] !== "undefined";
  } catch {
    return false;
  }
}

function parseSession(raw: string | null): AuthSession | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readWebSession(): AuthSession | null {
  try {
    if (canUseStorage("localStorage")) {
      const stored = parseSession(localStorage.getItem(SESSION_KEY));
      if (stored) {
        return { ...stored, persist: stored.persist !== false };
      }
    }
    if (canUseStorage("sessionStorage")) {
      const stored = parseSession(sessionStorage.getItem(SESSION_KEY));
      if (stored) {
        return { ...stored, persist: false };
      }
    }
  } catch {
    return null;
  }
  return null;
}

function nativeFileSystem(): {
  documentDirectory?: string | null;
  getInfoAsync?: (path: string) => Promise<{ exists: boolean }>;
  readAsStringAsync?: (path: string) => Promise<string>;
  writeAsStringAsync?: (path: string, data: string) => Promise<void>;
  deleteAsync?: (path: string, options?: { idempotent?: boolean }) => Promise<void>;
} | null {
  try {
    return require("expo-file-system") as {
      documentDirectory?: string | null;
      getInfoAsync?: (path: string) => Promise<{ exists: boolean }>;
      readAsStringAsync?: (path: string) => Promise<string>;
      writeAsStringAsync?: (path: string, data: string) => Promise<void>;
      deleteAsync?: (path: string, options?: { idempotent?: boolean }) => Promise<void>;
    };
  } catch {
    return null;
  }
}

function nativePath(): string | null {
  const fs = nativeFileSystem();
  if (!fs?.documentDirectory) {
    return null;
  }
  return `${fs.documentDirectory}${NATIVE_SESSION_FILE}`;
}

async function hydrateNativeSession(): Promise<void> {
  if (currentSession) {
    return;
  }
  const fs = nativeFileSystem();
  const path = nativePath();
  if (!fs?.getInfoAsync || !fs.readAsStringAsync || !path) {
    return;
  }
  try {
    const info = await fs.getInfoAsync(path);
    if (!info.exists) {
      return;
    }
    currentSession = parseSession(await fs.readAsStringAsync(path));
  } catch {
    currentSession = currentSession;
  }
}

function hydrate(): Promise<void> {
  if (hydrateDone) {
    return Promise.resolve();
  }
  if (!hydratePromise) {
    hydratePromise = hydrateNativeSession().finally(() => {
      hydrateDone = true;
    });
  }
  return hydratePromise;
}

void hydrate();

async function writeNativeSession(session: AuthSession | null): Promise<void> {
  const fs = nativeFileSystem();
  const path = nativePath();
  if (!fs || !path) {
    return;
  }
  try {
    if (!session || session.persist === false) {
      if (fs.deleteAsync) {
        await fs.deleteAsync(path, { idempotent: true });
      }
      return;
    }
    if (fs.writeAsStringAsync) {
      await fs.writeAsStringAsync(path, JSON.stringify(session));
    }
  } catch {
    // Native persistence is best-effort.
  }
}

function persistSession(session: AuthSession | null): void {
  currentSession = session;
  try {
    if (canUseStorage("localStorage")) {
      if (!session || session.persist === false) {
        localStorage.removeItem(SESSION_KEY);
      } else {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
    }
    if (canUseStorage("sessionStorage")) {
      if (session && session.persist === false) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  } catch {
    // Native runtimes without web storage keep the in-memory session only.
  }
  void writeNativeSession(session);
}

export async function login(credentials: Credentials, options?: { persist?: boolean }): Promise<AuthSession> {
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
    persist: options?.persist !== false,
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
    persist: false,
  });
  return currentSession!;
}

export async function logout(): Promise<void> {
  await hydrate();
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
  await hydrate();
  return currentSession;
}

async function refreshAccessToken(): Promise<boolean> {
  await hydrate();
  const session = currentSession;
  if (!session?.refreshToken || session.token === "dev-pass-token") {
    return false;
  }
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = (async () => {
    try {
      const result = await apiRequest<{
        accessToken: string;
        refreshToken?: string;
        user?: unknown;
      }>(authPath("/refresh"), {
        method: "POST",
        body: { refreshToken: session.refreshToken },
      });
      persistSession({
        ...session,
        token: result.accessToken,
        refreshToken: result.refreshToken ?? session.refreshToken,
        user: result.user ?? session.user,
      });
      return true;
    } catch {
      persistSession(null);
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function shouldRefresh(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401 && (err.code === "TOKEN_EXPIRED" || err.code === "INVALID_TOKEN");
}

export async function authorizedRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  await hydrate();
  const headers = new Headers(init.headers);
  if (currentSession?.token) {
    headers.set("Authorization", `Bearer ${currentSession.token}`);
  }
  try {
    return await apiRequest<T>(path, { ...init, headers });
  } catch (err) {
    if (!shouldRefresh(err)) {
      throw err;
    }
    const refreshed = await refreshAccessToken();
    if (!refreshed || !currentSession?.token) {
      throw err;
    }
    const retryHeaders = new Headers(init.headers);
    retryHeaders.set("Authorization", `Bearer ${currentSession.token}`);
    return apiRequest<T>(path, { ...init, headers: retryHeaders });
  }
}

export async function authorizedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  await hydrate();
  const headers = new Headers(init.headers);
  if (currentSession?.token) {
    headers.set("Authorization", `Bearer ${currentSession.token}`);
  }
  const { getApiBaseUrl } = await import("./api");
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  let response = await fetch(url, { ...init, headers });
  if (response.status === 401 && currentSession?.refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed && currentSession?.token) {
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set("Authorization", `Bearer ${currentSession.token}`);
      response = await fetch(url, { ...init, headers: retryHeaders });
    }
  }
  return response;
}
