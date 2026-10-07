import { apiRequest, authPath, ApiError, type ApiRequestInit } from "./api";

export type Credentials = {
  email: string;
  password: string;
};

export type AuthSession = {
  token?: string;
  refreshToken?: string;
  email: string;
  user?: unknown;
  persist?: boolean;
  cookie?: boolean;
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
    if (parsed?.token || parsed?.refreshToken) {
      return null;
    }
    if (!parsed?.cookie && !parsed?.email) {
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
      const raw = localStorage.getItem(SESSION_KEY);
      const stored = parseSession(raw);
      if (raw && !stored) localStorage.removeItem(SESSION_KEY);
      if (stored) {
        return { ...stored, persist: stored.persist !== false, cookie: true };
      }
    }
    if (canUseStorage("sessionStorage")) {
      const raw = sessionStorage.getItem(SESSION_KEY);
      const stored = parseSession(raw);
      if (raw && !stored) sessionStorage.removeItem(SESSION_KEY);
      if (stored) {
        return { ...stored, persist: false, cookie: true };
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
  const webSession = session?.cookie
    ? { email: session.email, user: session.user, persist: session.persist !== false, cookie: true }
    : null;
  try {
    if (canUseStorage("localStorage")) {
      if (!webSession || webSession.persist === false) {
        localStorage.removeItem(SESSION_KEY);
      } else {
        localStorage.setItem(SESSION_KEY, JSON.stringify(webSession));
      }
    }
    if (canUseStorage("sessionStorage")) {
      if (webSession && webSession.persist === false) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(webSession));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  } catch {
    // Native runtimes without web storage keep the in-memory session only.
  }
  void writeNativeSession(session?.cookie ? webSession : null);
}

export async function login(credentials: Credentials, options?: { persist?: boolean }): Promise<AuthSession> {
  if (!credentials.email || !credentials.password) {
    throw new Error("Invalid credentials.");
  }

  const result = await apiRequest<{
    user?: unknown;
  }>(authPath("/login"), {
    method: "POST",
    body: { email: credentials.email, password: credentials.password },
  });

  persistSession({
    email: credentials.email,
    user: result.user,
    persist: options?.persist !== false,
    cookie: true,
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
    email: "developer@local",
    persist: false,
    cookie: true,
  });
  return currentSession!;
}

export async function logout(): Promise<void> {
  await hydrate();
  const session = currentSession;
  try {
    if (session?.cookie && session.email !== "developer@local") {
      await authorizedRequest(authPath("/logout"), {
        method: "POST",
        body: {},
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
  if (!session?.cookie || session.email === "developer@local") {
    return false;
  }
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = (async () => {
    try {
      const result = await apiRequest<{ user?: unknown }>(authPath("/refresh"), {
        method: "POST",
        body: {},
      });
      persistSession({
        ...session,
        user: result.user ?? session.user,
        cookie: true,
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
  try {
    return await apiRequest<T>(path, { ...init, headers });
  } catch (err) {
    if (!shouldRefresh(err)) {
      throw err;
    }
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      throw err;
    }
    return apiRequest<T>(path, { ...init, headers: new Headers(init.headers) });
  }
}

export async function authorizedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  await hydrate();
  const headers = new Headers(init.headers);
  const { getApiBaseUrl } = await import("./api");
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  let response = await fetch(url, { ...init, headers, credentials: "include" });
  if (response.status === 401 && currentSession?.cookie) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(url, { ...init, headers: new Headers(init.headers), credentials: "include" });
    }
  }
  return response;
}
