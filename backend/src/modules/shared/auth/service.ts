import { env } from "../../../env.js";
import { toCivilDate } from "../utils/dates.js";
import { HttpError } from "../utils/http-error.js";
import {
  generateAccessToken,
  generateRandomToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from "../utils/security.js";
import { findEmployeeByEmail, findEmployeeById } from "../employees/repository.js";
import type { EmployeePublic } from "../employees/repository.js";
import { sendPasswordResetEmail } from "../services/email.service.js";
import * as authRepository from "./repository.js";
import type {
  ChangePasswordBody,
  ForgotPasswordBody,
  LoginBody,
  ResetPasswordBody,
} from "./validation.js";

function toPublicEmployee(employee: EmployeePublic) {
  return {
    employeeId: employee.employeeId,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    departmentId: employee.departmentId,
    role: employee.role,
    managerId: employee.managerId,
    joiningDate: toCivilDate(employee.joiningDate),
    createdAt: employee.createdAt.toISOString(),
    status: employee.status,
    obsolete: employee.obsolete,
  };
}

export async function login(body: LoginBody) {
  const employee = await findEmployeeByEmail(body.email);

  // Generic authentication error message to prevent enumeration
  if (!employee || employee.obsolete || employee.status !== "ACTIVE") {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const isValidPassword = await verifyPassword(body.password, employee.passwordHash);
  if (!isValidPassword) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  // Generate Access Token (JWT)
  const accessToken = generateAccessToken({
    employeeId: employee.employeeId,
    email: employee.email,
    role: employee.role,
    departmentId: employee.departmentId,
    status: employee.status,
  });

  // Generate Refresh Token (Opaque cryptographically secure random bytes)
  const rawRefreshToken = generateRandomToken(40);
  const tokenHash = hashToken(rawRefreshToken);
  const family = generateRandomToken(16);
  const expiresAt = new Date(Date.now() + env.jwtRefreshExpiryDays * 24 * 60 * 60 * 1000);

  await authRepository.createRefreshToken({
    employeeId: employee.employeeId,
    tokenHash,
    family,
    expiresAt,
  });

  return {
    accessToken,
    expiresIn: env.jwtAccessExpiry,
    refreshToken: rawRefreshToken,
    user: toPublicEmployee(employee),
  };
}

export async function refreshSession(rawRefreshToken: string) {
  const tokenHash = hashToken(rawRefreshToken);
  const record = await authRepository.findRefreshTokenByHash(tokenHash);

  if (!record) {
    throw new HttpError(401, "INVALID_TOKEN", "Invalid refresh token");
  }

  // Token Reuse Detection: if an already revoked token is presented, revoke the entire token family
  if (record.isRevoked) {
    await authRepository.revokeRefreshTokenFamily(record.family);
    throw new HttpError(401, "INVALID_TOKEN", "Refresh token has been revoked");
  }

  // Check Expiration
  if (new Date() > record.expiresAt) {
    await authRepository.revokeRefreshToken(record.refreshTokenId);
    throw new HttpError(401, "TOKEN_EXPIRED", "Refresh token has expired");
  }

  // Verify employee account status
  if (record.employee.obsolete || record.employee.status !== "ACTIVE") {
    await authRepository.revokeRefreshToken(record.refreshTokenId);
    throw new HttpError(401, "UNAUTHORIZED", "Account is inactive or does not exist");
  }

  // Rotate token atomically in transaction to eliminate race conditions
  const newRawRefreshToken = generateRandomToken(40);
  const newTokenHash = hashToken(newRawRefreshToken);
  const newExpiresAt = new Date(Date.now() + env.jwtRefreshExpiryDays * 24 * 60 * 60 * 1000);

  const rotationResult = await authRepository.rotateRefreshTokenAtomic(
    record.refreshTokenId,
    {
      employeeId: record.employeeId,
      tokenHash: newTokenHash,
      family: record.family,
      expiresAt: newExpiresAt,
    },
  );

  if (!rotationResult.success) {
    // If concurrent rotation already revoked this token, revoke the family and reject
    await authRepository.revokeRefreshTokenFamily(record.family);
    throw new HttpError(401, "INVALID_TOKEN", "Refresh token has already been used");
  }

  const newAccessToken = generateAccessToken({
    employeeId: record.employee.employeeId,
    email: record.employee.email,
    role: record.employee.role,
    departmentId: record.employee.departmentId,
    status: record.employee.status,
  });

  return {
    accessToken: newAccessToken,
    expiresIn: env.jwtAccessExpiry,
    refreshToken: newRawRefreshToken,
    user: toPublicEmployee(record.employee),
  };
}

export async function logout(employeeId: number, rawRefreshToken?: string) {
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    const record = await authRepository.findRefreshTokenByHash(tokenHash);
    if (record) {
      await authRepository.revokeRefreshToken(record.refreshTokenId);
      return;
    }
  }
  // If no specific refresh token is provided, revoke all refresh tokens for this employee
  await authRepository.revokeAllEmployeeRefreshTokens(employeeId);
}

export async function getMe(employeeId: number) {
  const employee = await findEmployeeById(employeeId);
  if (!employee || employee.obsolete || employee.status !== "ACTIVE") {
    throw new HttpError(404, "NOT_FOUND", "Employee not found or inactive");
  }
  return toPublicEmployee(employee);
}

export async function changePassword(employeeId: number, body: ChangePasswordBody) {
  const employee = await findEmployeeById(employeeId);
  if (!employee || employee.obsolete || employee.status !== "ACTIVE") {
    throw new HttpError(404, "NOT_FOUND", "Employee not found");
  }

  const fullEmployee = await findEmployeeByEmail(employee.email);
  if (!fullEmployee) {
    throw new HttpError(404, "NOT_FOUND", "Employee not found");
  }

  const isValidPassword = await verifyPassword(body.currentPassword, fullEmployee.passwordHash);
  if (!isValidPassword) {
    throw new HttpError(400, "INVALID_CREDENTIALS", "Current password is incorrect");
  }

  const newPasswordHash = await hashPassword(body.newPassword);
  await authRepository.updateEmployeePassword(employeeId, newPasswordHash);

  // Invalidate all active sessions/refresh tokens upon password change
  await authRepository.revokeAllEmployeeRefreshTokens(employeeId);

  return { message: "Password changed successfully" };
}

export async function forgotPassword(body: ForgotPasswordBody) {
  const employee = await findEmployeeByEmail(body.email);

  if (employee && !employee.obsolete && employee.status === "ACTIVE") {
    const rawResetToken = generateRandomToken(32);
    const tokenHash = hashToken(rawResetToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15-minute token lifetime

    await authRepository.createPasswordResetToken({
      employeeId: employee.employeeId,
      tokenHash,
      expiresAt,
    });

    const resetLink = `${env.appUrl}/reset-password?token=${rawResetToken}`;
    await sendPasswordResetEmail(employee.email, resetLink);
  }

  // Always return generic 200 response to prevent account enumeration
  return {
    message: "If your email is registered, you will receive password reset instructions shortly.",
  };
}

export async function resetPassword(body: ResetPasswordBody) {
  const tokenHash = hashToken(body.token);
  const record = await authRepository.findPasswordResetTokenByHash(tokenHash);

  if (!record || record.isUsed || new Date() > record.expiresAt) {
    throw new HttpError(400, "INVALID_OR_EXPIRED_TOKEN", "Invalid or expired password reset token");
  }

  if (record.employee.obsolete || record.employee.status !== "ACTIVE") {
    throw new HttpError(400, "INVALID_OR_EXPIRED_TOKEN", "Invalid or expired password reset token");
  }

  const newPasswordHash = await hashPassword(body.newPassword);
  await authRepository.updateEmployeePassword(record.employeeId, newPasswordHash);
  await authRepository.markPasswordResetTokenUsed(record.resetTokenId);

  // Invalidate all active refresh tokens for the employee after password reset
  await authRepository.revokeAllEmployeeRefreshTokens(record.employeeId);

  return {
    message: "Password reset successfully. You may now log in with your new password.",
  };
}
