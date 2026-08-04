import type { Request, Response } from 'express';
import { userService } from '../services/user.service.js';
import { createUserSchema, updateUserSchema } from '../validators/user.schemas.js';
import { serialize } from '../utils/serialize.js';

export const userController = {
  async list(req: Request, res: Response) {
    const result = await userService.list(req.user!.establishmentId);
    res.json(serialize(result));
  },

  async create(req: Request, res: Response) {
    const body = createUserSchema.parse(req.body);
    const result = await userService.create(req.user!.establishmentId, body);
    res.status(201).json(serialize(result));
  },

  async update(req: Request, res: Response) {
    const body = updateUserSchema.parse(req.body);
    const result = await userService.update(req.params.id!, req.user!.establishmentId, body, {
      userId: req.user!.userId,
      role: req.user!.role,
    });
    res.json(serialize(result));
  },
};
