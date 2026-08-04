import { qrRepository } from '../repositories/qr.repository.js';
import { AppError } from '../utils/AppError.js';
import type { CreateQrCodeInput, UpdateQrCodeInput } from '../validators/qr.schemas.js';

export const qrService = {
  async list(establishmentId: string) {
    return qrRepository.findAll(establishmentId);
  },

  async getById(id: string, establishmentId: string) {
    const qrCode = await qrRepository.findById(id, establishmentId);
    if (!qrCode) {
      throw new AppError('QR Code não encontrado.', 404);
    }
    return qrCode;
  },

  async create(establishmentId: string, input: CreateQrCodeInput) {
    return qrRepository.create(establishmentId, input);
  },

  async update(id: string, establishmentId: string, input: UpdateQrCodeInput) {
    await this.getById(id, establishmentId);
    return qrRepository.update(id, establishmentId, input);
  },

  async delete(id: string, establishmentId: string) {
    await this.getById(id, establishmentId);
    const result = await qrRepository.delete(id, establishmentId);
    if (result.count === 0) {
      throw new AppError('QR Code não encontrado.', 404);
    }
  },
};
