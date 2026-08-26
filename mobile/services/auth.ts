export type Credentials = {
  email: string;
  password: string;
};

export type AuthSession = {
  token: string;
  email: string;
};

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
  return {
    token: "mock-token",
    email: credentials.email,
  };
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
  // TODO: Connect your authentication API here.
}

export async function getSession(): Promise<AuthSession | null> {
  // TODO: Connect your authentication API here.
  return null;
}
