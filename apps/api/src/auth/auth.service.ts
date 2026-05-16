import crypto from 'node:crypto';
import { prisma } from '../db/prisma.js';
import { AppError } from '../utils/app-error.js';
import { hashPassword, verifyPassword } from './password.js';
import {
  type AccessTokenPayload,
  type RefreshTokenPayload,
  verifyRefreshToken
} from './session.js';
import { slugify } from '../utils/slugify.js';
import { logger } from '../utils/logger.js';
import type { LoginInput, RegisterInput } from '@agencyops/shared';
import type { UserRole } from '@agencyops/shared';

type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

function buildSafeUser(user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization: { id: string; name: string; slug: string };
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organization: user.organization
  };
}

async function createUniqueOrganizationSlug(name: string): Promise<string> {
  const baseSlug = slugify(name);
  const existing = await prisma.organization.count({
    where: { slug: { startsWith: baseSlug } }
  });
  return existing === 0 ? baseSlug : `${baseSlug}-${existing + 1}`;
}

async function createSessionPayload(
  user: AccessTokenPayload,
  sessionId: string = crypto.randomUUID()
): Promise<{ accessPayload: AccessTokenPayload; refreshPayload: RefreshTokenPayload; refreshToken: string }> {
  const refreshPayload: RefreshTokenPayload = {
    ...user,
    sessionId
  };

  const { signRefreshToken } = await import('./session.js');
  return {
    accessPayload: user,
    refreshPayload,
    refreshToken: signRefreshToken(refreshPayload)
  };
}

export class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existingUser) {
      throw new AppError('Email is already registered', 409, 'email_taken');
    }

    const slug = await createUniqueOrganizationSlug(input.organizationName);
    const passwordHash = await hashPassword(input.password);

    const { user, refreshToken, refreshPayload, accessPayload } = await prisma.$transaction(
      async (transaction) => {
        const organization = await transaction.organization.create({
          data: {
            name: input.organizationName,
            slug,
            notificationSetting: {
              create: {
                emailNotificationsEnabled: false
              }
            }
          }
        });

        const userRecord = await transaction.user.create({
          data: {
            email: input.email,
            name: input.name,
            passwordHash,
            role: 'owner',
            organizationId: organization.id
          },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        });

        const tokenPayload: AccessTokenPayload = {
          userId: userRecord.id,
          organizationId: organization.id,
          role: userRecord.role
        };
        const sessionData = await createSessionPayload(tokenPayload);

        await transaction.userSession.create({
          data: {
            id: sessionData.refreshPayload.sessionId,
            userId: userRecord.id,
            refreshTokenHash: await hashPassword(sessionData.refreshToken),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        });

        return {
          user: buildSafeUser(userRecord),
          ...sessionData
        };
      }
    );

    return { user, refreshToken, refreshPayload, accessPayload };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
      throw new AppError('Invalid email or password', 401, 'invalid_credentials');
    }

    const accessPayload: AccessTokenPayload = {
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role
    };

    const { refreshToken, refreshPayload } = await createSessionPayload(accessPayload);

    await prisma.userSession.create({
      data: {
        id: refreshPayload.sessionId,
        userId: user.id,
        refreshTokenHash: await hashPassword(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return {
      user: buildSafeUser(user),
      accessPayload,
      refreshPayload,
      refreshToken
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 401, 'invalid_refresh_token');
    }

    const payload = verifyRefreshToken(refreshToken);

    const session = await prisma.userSession.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

    if (!session || session.expiresAt < new Date()) {
      throw new AppError('Refresh session expired', 401, 'invalid_refresh_token');
    }

    const tokenMatches = await verifyPassword(session.refreshTokenHash, refreshToken);
    if (!tokenMatches) {
      logger.warn({ sessionId: payload.sessionId }, 'Refresh token hash mismatch');
      await prisma.userSession.deleteMany({ where: { id: payload.sessionId } });
      throw new AppError('Refresh session invalid', 401, 'invalid_refresh_token');
    }

    const accessPayload: AccessTokenPayload = {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      role: session.user.role
    };
    const nextSession = await createSessionPayload(accessPayload, session.id);

    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: await hashPassword(nextSession.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date()
      }
    });

    return {
      user: buildSafeUser(session.user),
      accessPayload,
      refreshPayload: nextSession.refreshPayload,
      refreshToken: nextSession.refreshToken
    };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.userSession.deleteMany({
        where: { id: payload.sessionId }
      });
    } catch (error) {
      logger.debug({ err: error }, 'Ignoring invalid refresh token during logout');
    }
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'user_not_found');
    }

    return buildSafeUser(user);
  }
}
