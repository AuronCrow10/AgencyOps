import type { UserRole } from '@agencyops/shared';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: {
        userId: string;
        organizationId: string;
        role: UserRole;
        sessionId?: string;
      };
    }
  }
}

export {};
