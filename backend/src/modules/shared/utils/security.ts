import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../../env.js";

const BCRYPT_ROUNDS = 10;

export type AuthTokenPayload = {
  employeeId: number;
  email: string;
  role: string;
  departmentId: number;
  status: string;
};

/**
 * Mixes the plaintext password with the server-side pepper using HMAC-SHA256.
 * This guarantees fixed length (mitigating bcrypt 72-byte truncation) and
 * prevents offline dictionary attacks without the server pepper.
 */
function preparePasswordWithPepper(password: string): string {
  return crypto
    .createHmac("sha256", env.passwordPepper)
    .update(password)
    .digest("hex");
}

/**
 * Securely hashes a password using server-side pepper and bcrypt with per-password salt.
 */
export async function hashPassword(password: string): Promise<string> {
  const peppered = preparePasswordWithPepper(password);
  return bcrypt.hash(peppered, BCRYPT_ROUNDS);
}

/**
 * Securely verifies a plaintext password against a stored bcrypt hash using server-side pepper.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const peppered = preparePasswordWithPepper(password);
  return bcrypt.compare(peppered, hash);
}

/**
 * Generates a cryptographically secure random token (e.g. for refresh tokens or password resets).
 */
export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Computes the SHA-256 hash of a token for secure database storage.
 * The raw token is never stored in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a short-lived signed JWT access token for mobile/API clients.
 */
export function generateAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtAccessExpiry as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

/**
 * Verifies a JWT access token signature and expiration.
 */
export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtSecret, {
    algorithms: ["HS256"],
  }) as AuthTokenPayload;
}
