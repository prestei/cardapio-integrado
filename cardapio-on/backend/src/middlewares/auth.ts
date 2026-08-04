import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';
import { AppError } from '../utils/AppError.js';

interface JwtPayload {
  userId: string;
  establishmentId: string;
  role: UserRole;
  email: string;
  name: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurado.');
  }
  return secret;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('Token de autenticação não informado.', 401));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
    req.user = {
      userId: payload.userId,
      establishmentId: payload.establishmentId,
      role: payload.role,
      email: payload.email,
      name: payload.name,
    };
    next();
  } catch {
    next(new AppError('Token inválido ou expirado.', 401));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Usuário não autenticado.', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError('Você não tem permissão para acessar este recurso.', 403));
      return;
    }

    next();
  };
}

export function signToken(payload: JwtPayload): string {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
}
