import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@prisma/client';
import { AppError } from '../utils/AppError.js';
import { hasPermission, type Permission } from '../utils/permissions.js';

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Usuário não autenticado.', 401));
      return;
    }

    const role = req.user.role as UserRole;
    const ok = permissions.every((p) => hasPermission(role, p));
    if (!ok) {
      next(new AppError('Você não tem permissão para acessar este recurso.', 403));
      return;
    }

    next();
  };
}
