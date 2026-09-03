import type { Employee, PasswordResetToken, RefreshToken } from "../../../generated/prisma/client.js";
import { prisma } from "../db/index.js";

export function createRefreshToken(data: {
  employeeId: number;
  tokenHash: string;
  family: string;
  expiresAt: Date;
}): Promise<RefreshToken> {
  return prisma.refreshToken.create({
    data: {
      employeeId: data.employeeId,
      tokenHash: data.tokenHash,
      family: data.family,
      expiresAt: data.expiresAt,
    },
  });
}

export function findRefreshTokenByHash(
  tokenHash: string,
): Promise<(RefreshToken & { employee: Employee }) | null> {
  return prisma.refreshToken.findFirst({
    where: { tokenHash },
    include: { employee: true },
  });
}

export function revokeRefreshToken(refreshTokenId: number): Promise<RefreshToken> {
  return prisma.refreshToken.update({
    where: { refreshTokenId },
    data: { isRevoked: true },
  });
}

export async function revokeRefreshTokenFamily(family: string): Promise<{ count: number }> {
  return prisma.refreshToken.updateMany({
    where: { family, isRevoked: false },
    data: { isRevoked: true },
  });
}

export async function revokeAllEmployeeRefreshTokens(employeeId: number): Promise<{ count: number }> {
  return prisma.refreshToken.updateMany({
    where: { employeeId, isRevoked: false },
    data: { isRevoked: true },
  });
}

/**
 * Atomically revokes the old refresh token and creates a new one in an isolated transaction.
 * If the old token was already revoked by a concurrent request, the transaction returns success: false.
 */
export async function rotateRefreshTokenAtomic(
  oldRefreshTokenId: number,
  newData: {
    employeeId: number;
    tokenHash: string;
    family: string;
    expiresAt: Date;
  },
): Promise<{ success: boolean; newRefreshToken?: RefreshToken }> {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.refreshToken.updateMany({
      where: { refreshTokenId: oldRefreshTokenId, isRevoked: false },
      data: { isRevoked: true },
    });

    if (updated.count === 0) {
      return { success: false };
    }

    const newRefreshToken = await tx.refreshToken.create({
      data: {
        employeeId: newData.employeeId,
        tokenHash: newData.tokenHash,
        family: newData.family,
        expiresAt: newData.expiresAt,
      },
    });

    return { success: true, newRefreshToken };
  });
}

export function createPasswordResetToken(data: {
  employeeId: number;
  tokenHash: string;
  expiresAt: Date;
}): Promise<PasswordResetToken> {
  return prisma.passwordResetToken.create({
    data: {
      employeeId: data.employeeId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
    },
  });
}

export function findPasswordResetTokenByHash(
  tokenHash: string,
): Promise<(PasswordResetToken & { employee: Employee }) | null> {
  return prisma.passwordResetToken.findFirst({
    where: { tokenHash },
    include: { employee: true },
  });
}

export function markPasswordResetTokenUsed(resetTokenId: number): Promise<PasswordResetToken> {
  return prisma.passwordResetToken.update({
    where: { resetTokenId },
    data: { isUsed: true },
  });
}

export function updateEmployeePassword(
  employeeId: number,
  passwordHash: string,
): Promise<Employee> {
  return prisma.employee.update({
    where: { employeeId },
    data: { passwordHash },
  });
}
