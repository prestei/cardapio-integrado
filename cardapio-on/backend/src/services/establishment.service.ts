import { establishmentRepository } from '../repositories/establishment.repository.js';
import { AppError } from '../utils/AppError.js';

export const establishmentService = {
  async get(establishmentId: string) {
    const establishment = await establishmentRepository.findById(establishmentId);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }
    return establishment;
  },

  async update(
    establishmentId: string,
    data: {
      name?: string;
      description?: string;
      phone?: string;
      whatsapp?: string;
      email?: string;
      address?: string;
      cnpj?: string;
      logoUrl?: string;
      bannerUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      isOpen?: boolean;
    },
  ) {
    await this.get(establishmentId);
    return establishmentRepository.update(establishmentId, data);
  },
};
