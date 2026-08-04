import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../lib/logger.js';
import { AppError } from '../utils/AppError.js';
import { serialize } from '../utils/serialize.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(serialize({ error: err.message }));
    return;
  }

  if (err instanceof ZodError) {
    const message = err.errors.map((e) => e.message).join(', ');
    res.status(400).json(serialize({ error: message || 'Dados inválidos.' }));
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json(serialize({ error: 'Registro duplicado.' }));
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json(serialize({ error: 'Registro não encontrado.' }));
      return;
    }
  }

  logger.error({ err }, 'Erro não tratado');
  res.status(500).json(serialize({ error: 'Erro interno do servidor.' }));
}
