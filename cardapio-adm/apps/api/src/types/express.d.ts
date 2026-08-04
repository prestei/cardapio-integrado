import type { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface UserPayload {
      userId: string;
      establishmentId: string;
      role: UserRole;
      email: string;
      name: string;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
