import type { Request, Response } from 'express';
import multer from 'multer';
import os from 'node:os';
import path from 'node:path';
import { menuImportService } from '../services/menu-import.service.js';
import { updateMenuImportDraftSchema } from '../validators/menu-import.schemas.js';
import { serialize } from '../utils/serialize.js';
import { MENU_IMPORT_LIMITS } from '../lib/menuImportStorage.js';
import { AppError } from '../utils/AppError.js';

const upload = multer({
  dest: path.join(os.tmpdir(), 'cardapio-menu-imports'),
  limits: {
    fileSize: MENU_IMPORT_LIMITS.maxFileSizeBytes,
    files: MENU_IMPORT_LIMITS.maxFiles,
  },
});

export const menuImportUpload = upload.array('files', MENU_IMPORT_LIMITS.maxFiles);

export const menuImportController = {
  async list(req: Request, res: Response) {
    const items = await menuImportService.list(req.user!.establishmentId);
    res.json(serialize(items));
  },

  async getById(req: Request, res: Response) {
    const item = await menuImportService.getById(req.params.id, req.user!.establishmentId);
    res.json(serialize(item));
  },

  async create(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) {
      throw new AppError('Envie pelo menos um arquivo.', 400);
    }

    const item = await menuImportService.createFromUpload(
      req.user!.establishmentId,
      req.user!.userId,
      files,
    );
    res.status(201).json(serialize(item));
  },

  async update(req: Request, res: Response) {
    const draft = updateMenuImportDraftSchema.parse(req.body);
    const item = await menuImportService.updateDraft(
      req.params.id,
      req.user!.establishmentId,
      draft,
    );
    res.json(serialize(item));
  },

  async confirm(req: Request, res: Response) {
    const item = await menuImportService.confirm(req.params.id, req.user!.establishmentId);
    res.json(serialize(item));
  },

  async process(req: Request, res: Response) {
    const item = await menuImportService.reprocess(req.params.id, req.user!.establishmentId);
    res.json(serialize(item));
  },

  async cancel(req: Request, res: Response) {
    const item = await menuImportService.cancel(req.params.id, req.user!.establishmentId);
    res.json(serialize(item));
  },

  async delete(req: Request, res: Response) {
    await menuImportService.delete(req.params.id, req.user!.establishmentId);
    res.status(204).send();
  },

  async getFile(req: Request, res: Response) {
    const { stream, file } = await menuImportService.getFileStream(
      req.params.id,
      req.params.fileId,
      req.user!.establishmentId,
    );
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(stream);
  },
};
