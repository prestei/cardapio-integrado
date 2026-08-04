import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../validators/auth.schemas.js';
import { serialize } from '../utils/serialize.js';

export const authController = {
  async register(req: Request, res: Response) {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body);
    res.status(201).json(serialize(result));
  },

  async login(req: Request, res: Response) {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body);
    res.json(serialize(result));
  },

  async me(req: Request, res: Response) {
    const result = await authService.me(req.user!.userId);
    res.json(serialize(result));
  },

  async forgotPassword(req: Request, res: Response) {
    const body = forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(body);
    res.json(serialize(result));
  },

  async resetPassword(req: Request, res: Response) {
    const body = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(body);
    res.json(serialize(result));
  },
};
