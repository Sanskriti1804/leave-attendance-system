import * as SecureStore from "expo-secure-store";
import { apiRequest, ApiError, authPath } from "./api";

export type Credentials = {
  email: string;
  password: string;
};

export type AuthUser = {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: number;
  role: string;
  managerId: number | null;
  joiningDate: string;
  createdAt: string;
  status: string;
  obsolete: boolean;
};

export type AuthSession = {
  token: string;
  email: string;
  refreshToken?: string;
  user?: AuthUser;
};

type LoginResponse = {
  accessToken: string;
  expiresIn: string;
  refreshToken: string;
  user: AuthUser;
};

const ACCESS_KEY = "lams.accessToken";
const REFRESH_KEY = "lams.refreshToken";
const SESSION_KEY = "lams.session";
const DEV_PASS_TOKEN = "dev-pass-token";

let memorySession: AuthSession | null = null;
let refreshInFlight: Promise<string | null> | null = null;

async function writeStore(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // SecureStore can be unavailable in some environments; memory still holds the session.
  }
}

async function readStore(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function deleteStore(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}

async function persistSession(session: AuthSession): Promise<void> {
  memorySession = session;
  await writeStore(ACCESS_KEY, session.token);
  if (session.refreshToken) {
    await writeStore(REFRESH_KEY, session.refreshToken);
  } else {
    await deleteStore(REFRESH_KEY);
  }
  await writeStore(
    SESSION_KEY,
    JSON.stringify({
      email: session.email,
      user: session.user ?? null,
    }),
  );
}

async function clearPersistedSession(): Promise<void> {
  memorySession = null;
  await deleteStore(ACCESS_KEY);
  await deleteStore(REFRESH_KEY);
  await deleteStore(SESSION_KEY);
}

function sessionFromLogin(data: LoginResponse): AuthSession {
  return {
    token: data.accessToken,
    email: data.user.email,
    refreshToken: data.refreshToken,
    user: data.user,
  };
}

function isBackendSession(session: AuthSession | null): boolean {
  return Boolean(session?.token && session.token !== DEV_PASS_TOKEN && session.refreshToken);
}

/**
 * Placeholder authentication service.
 * Replace the body of these functions with your real API calls.
 */
export async function login(credentials: Credentials): Promise<AuthSession> {
  if (!credentials.email || !credentials.password) {
    throw new Error("Invalid credentials.");
  }

  try {
    const data = await apiRequest<LoginResponse>(authPath("/login"), {
      method: "POST",
      skipAuth: true,
      body: {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      },
    });
    const session = sessionFromLogin(data);
    await persistSession(session);
    return session;
  } catch (err) {
    if (err instanceof ApiError) {
      throw new Error(err.message);
    }
    throw err instanceof Error ? err : new Error("Login failed.");
  }
}

/**
 * Developer bypass used by the Login screen Pass button.
 * Skips credential validation so you can navigate the app while wiring auth.
 * Remove or gate this before shipping to production.
 */
export async function passLogin(): Promise<AuthSession> {
  // TODO: Optionally hook a real "guest" / "dev" auth endpoint here.
  await new Promise((resolve) => setTimeout(resolve, 200));

  return {
    token: "dev-pass-token",
    email: "developer@local",
  };
}

export async function logout(): Promise<void> {
  const session = memorySession ?? (await getSession());
  if (isBackendSession(session)) {
    try {
      await apiRequest(authPath("/logout"), {
        method: "POST",
        accessToken: session!.token,
        body: session!.refreshToken ? { refreshToken: session!.refreshToken } : undefined,
      });
    } catch {
      // Still clear local session if the network call fails.
    }
  }
  await clearPersistedSession();
}

export async function getSession(): Promise<AuthSession | null> {
  if (memorySession) {
    return memorySession;
  }

  const token = await readStore(ACCESS_KEY);
  const emailJson = await readStore(SESSION_KEY);
  if (!token || !emailJson) {
    return null;
  }

  let email = "";
  let user: AuthUser | undefined;
  try {
    const parsed = JSON.parse(emailJson) as { email?: string; user?: AuthUser | null };
    email = parsed.email ?? "";
    user = parsed.user ?? undefined;
  } catch {
    email = "";
  }

  const refreshToken = (await readStore(REFRESH_KEY)) ?? undefined;
  memorySession = { token, email, refreshToken, user };
  return memorySession;
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  if (!session?.token || session.token === DEV_PASS_TOKEN) {
    return null;
  }
  return session.token;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const session = await getSession();
    if (!session?.refreshToken) {
      return null;
    }

    try {
      const data = await apiRequest<LoginResponse>(authPath("/refresh"), {
        method: "POST",
        skipAuth: true,
        body: { refreshToken: session.refreshToken },
      });
      const next = sessionFromLogin(data);
      await persistSession(next);
      return next.token;
    } catch {
      await clearPersistedSession();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function authorizedRequest<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  let token = await getAccessToken();
  try {
    return await apiRequest<T>(path, {
      method: options.method,
      body: options.body,
      accessToken: token,
    });
  } catch (err) {
    const expired =
      err instanceof ApiError &&
      err.status === 401 &&
      (err.code === "TOKEN_EXPIRED" || err.code === "INVALID_TOKEN" || err.code === "UNAUTHORIZED");
    if (!expired) {
      throw err;
    }
    token = await refreshAccessToken();
    if (!token) {
      throw err;
    }
    return apiRequest<T>(path, {
      method: options.method,
      body: options.body,
      accessToken: token,
    });
  }
}
