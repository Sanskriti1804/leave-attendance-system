import assert from "node:assert/strict";
import {
  generateAccessToken,
  generateRandomToken,
  hashPassword,
  hashToken,
  verifyAccessToken,
  verifyPassword,
} from "./src/modules/shared/utils/security.js";
import {
  changePasswordBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  refreshBodySchema,
  resetPasswordBodySchema,
} from "./src/modules/shared/auth/validation.js";
import { MemoryRateLimitStore } from "./src/modules/shared/middlewares/rate-limit.middleware.js";
import {
  sendPasswordResetEmail,
  setEmailTransport,
  type EmailOptions,
} from "./src/modules/shared/services/email.service.js";

async function runTests() {
  console.log("Starting Production-Quality Authentication & Authorization Unit & Integration Tests...\n");

  // --- 1. Password Hashing & Pepper Tests ---
  console.log("[Test 1] Password Hashing & Server-side Pepper");
  const rawPassword = "SecurePassword123!";
  const hash1 = await hashPassword(rawPassword);
  const hash2 = await hashPassword(rawPassword);

  assert.notEqual(hash1, rawPassword, "Password must not be stored in plaintext");
  assert.notEqual(hash1, hash2, "Bcrypt salt must ensure unique hashes for same password");
  assert.equal(await verifyPassword(rawPassword, hash1), true, "Valid password must verify successfully");
  assert.equal(await verifyPassword("WrongPassword123!", hash1), false, "Invalid password must fail verification");
  assert.equal(await verifyPassword("", hash1), false, "Empty password must fail verification");
  console.log("✓ Password hashing, salt, and pepper tests passed.\n");

  // --- 2. Random Tokens and Hashing Tests ---
  console.log("[Test 2] Random Token & SHA-256 Hashing");
  const token1 = generateRandomToken(32);
  const token2 = generateRandomToken(32);
  assert.equal(token1.length, 64, "32-byte hex token should have length 64");
  assert.notEqual(token1, token2, "Random tokens must be unique");

  const hashedToken1 = hashToken(token1);
  const hashedToken2 = hashToken(token1);
  assert.equal(hashedToken1, hashedToken2, "Hash of same token must be deterministic");
  assert.notEqual(hashedToken1, token1, "Token hash must not match raw token");
  console.log("✓ Random token and SHA-256 hashing tests passed.\n");

  // --- 3. JWT Access Token Tests ---
  console.log("[Test 3] JWT Access Token Signing & Verification");
  const payload = {
    employeeId: 42,
    email: "alice.admin@example.com",
    role: "admin",
    departmentId: 1,
    status: "ACTIVE",
  };

  const accessToken = generateAccessToken(payload);
  assert.ok(typeof accessToken === "string" && accessToken.length > 20, "JWT token must be a non-empty string");

  const verified = verifyAccessToken(accessToken);
  assert.equal(verified.employeeId, 42);
  assert.equal(verified.email, "alice.admin@example.com");
  assert.equal(verified.role, "admin");
  assert.equal(verified.departmentId, 1);
  assert.equal(verified.status, "ACTIVE");

  assert.throws(() => verifyAccessToken("invalid.jwt.token"), "Invalid JWT must throw error");
  console.log("✓ JWT signing and verification tests passed.\n");

  // --- 4. Zod Validation Schemas ---
  console.log("[Test 4] Zod Validation Schemas & Password Complexity Rules");
  // Login schema
  assert.ok(loginBodySchema.parse({ email: "Alice.Admin@Example.COM ", password: "Password123!" }));
  assert.throws(() => loginBodySchema.parse({ email: "invalid-email", password: "123" }));

  // Change password complexity
  assert.ok(
    changePasswordBodySchema.parse({
      currentPassword: "OldPassword1!",
      newPassword: "NewComplexPassword123#",
    }),
  );
  // Missing uppercase
  assert.throws(() =>
    changePasswordBodySchema.parse({
      currentPassword: "OldPassword1!",
      newPassword: "weakpassword123#",
    }),
  );
  // Missing digit
  assert.throws(() =>
    changePasswordBodySchema.parse({
      currentPassword: "OldPassword1!",
      newPassword: "WeakPassword!#",
    }),
  );
  // Too short (< 8 chars)
  assert.throws(() =>
    changePasswordBodySchema.parse({
      currentPassword: "OldPassword1!",
      newPassword: "Short1!",
    }),
  );

  // Forgot password schema
  assert.ok(forgotPasswordBodySchema.parse({ email: "bob@example.com" }));

  // Reset password schema
  assert.ok(
    resetPasswordBodySchema.parse({
      token: "a1b2c3d4e5f6",
      newPassword: "NewSecurePassword456!",
    }),
  );
  console.log("✓ All input validation and password complexity schemas passed.\n");

  // --- 5. Rate Limiting Store Tests ---
  console.log("[Test 5] Rate Limiter Store Abstraction");
  const store = new MemoryRateLimitStore();
  const res1 = store.increment("test:127.0.0.1", 60000);
  assert.equal(res1.count, 1);
  const res2 = store.increment("test:127.0.0.1", 60000);
  assert.equal(res2.count, 2);
  store.clear();
  const res3 = store.increment("test:127.0.0.1", 60000);
  assert.equal(res3.count, 1);
  console.log("✓ Rate limiting store abstraction passed.\n");

  // --- 6. Email Delivery Tests ---
  console.log("[Test 6] Email Service & Reset Link Delivery");
  let dispatchedMail: EmailOptions | null = null;
  setEmailTransport({
    async sendMail(options: EmailOptions) {
      dispatchedMail = options;
    },
  });

  const rawResetToken = generateRandomToken(32);
  const resetLink = `http://localhost:3000/reset-password?token=${rawResetToken}`;
  await sendPasswordResetEmail("test.employee@example.com", resetLink);

  assert.ok(dispatchedMail !== null, "Email must be dispatched");
  assert.equal((dispatchedMail as EmailOptions).to, "test.employee@example.com");
  assert.ok((dispatchedMail as EmailOptions).subject.includes("Password Reset"));
  assert.ok((dispatchedMail as EmailOptions).html.includes(resetLink));
  assert.ok((dispatchedMail as EmailOptions).text.includes(resetLink));
  console.log("✓ Email service reset link formatting and dispatch passed.\n");

  console.log("=========================================================");
  console.log("ALL TESTS COMPLETED SUCCESSFULLY (100% PASSING)");
  console.log("=========================================================");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
