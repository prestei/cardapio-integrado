import { additionalRepository } from '../repositories/additional.repository.js';
import { AppError } from '../utils/AppError.js';
import type {
  CreateAdditionalGroupInput,
  UpdateAdditionalGroupInput,
  CreateAdditionalInput,
  UpdateAdditionalInput,
  LinkProductToGroupInput,
} from '../validators/additional.schemas.js';

export const additionalService = {
  async list(establishmentId: string) {
    return additionalRepository.findAll(establishmentId);
  },

  async getById(id: string, establishmentId: string) {
    const group = await additionalRepository.findById(id, establishmentId);
    if (!group) {
      throw new AppError('Grupo de adicionais não encontrado.', 404);
    }
    return group;
  },

  async create(establishmentId: string, input: CreateAdditionalGroupInput) {
    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
      const max = await additionalRepository.getMaxSortOrder(establishmentId);
      sortOrder = (max._max.sortOrder ?? -1) + 1;
    }

    return additionalRepository.create(establishmentId, { ...input, sortOrder });
  },

  async update(id: string, establishmentId: string, input: UpdateAdditionalGroupInput) {
    await this.getById(id, establishmentId);
    return additionalRepository.update(id, establishmentId, input);
  },

  async delete(id: string, establishmentId: string) {
    await this.getById(id, establishmentId);

    const used = await additionalRepository.hasOrderHistory(id);
    if (used) {
      await additionalRepository.softDelete(id, establishmentId);
      return { softDeleted: true as const };
    }

    const result = await additionalRepository.hardDelete(id, establishmentId);
    if (result.count === 0) {
      throw new AppError('Grupo de adicionais não encontrado.', 404);
    }
    return { softDeleted: false as const };
  },

  async createAdditional(
    groupId: string,
    establishmentId: string,
    input: CreateAdditionalInput,
  ) {
    await this.getById(groupId, establishmentId);

    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
      const max = await additionalRepository.getMaxAdditionalSortOrder(groupId);
      sortOrder = (max._max.sortOrder ?? -1) + 1;
    }

    return additionalRepository.createAdditional(groupId, {
      name: input.name,
      description: input.description,
      price: input.price ?? 0,
      imageUrl: input.imageUrl || undefined,
      isAvailable: input.isAvailable,
      sortOrder,
    });
  },

  async updateAdditional(
    additionalId: string,
    establishmentId: string,
    input: UpdateAdditionalInput,
  ) {
    const additional = await additionalRepository.findAdditionalById(
      additionalId,
      establishmentId,
    );
    if (!additional) {
      throw new AppError('Adicional não encontrado.', 404);
    }

    return additionalRepository.updateAdditional(additionalId, {
      ...input,
      imageUrl: input.imageUrl === '' ? null : input.imageUrl,
    });
  },

  async deleteAdditional(additionalId: string, establishmentId: string) {
    const additional = await additionalRepository.findAdditionalById(
      additionalId,
      establishmentId,
    );
    if (!additional) {
      throw new AppError('Adicional não encontrado.', 404);
    }

    await additionalRepository.deleteAdditional(additionalId);
  },

  async linkProduct(
    groupId: string,
    establishmentId: string,
    input: LinkProductToGroupInput,
  ) {
    await this.getById(groupId, establishmentId);

    const product = await additionalRepository.findProductInEstablishment(
      input.productId,
      establishmentId,
    );
    if (!product) {
      throw new AppError('Produto não encontrado.', 404);
    }

    const existing = await additionalRepository.findLink(groupId, input.productId);
    if (existing) {
      throw new AppError('Produto já vinculado a este grupo de adicionais.', 409);
    }

    return additionalRepository.linkProduct(groupId, input.productId, input.sortOrder ?? 0);
  },

  async unlinkProduct(groupId: string, establishmentId: string, productId: string) {
    await this.getById(groupId, establishmentId);
    const result = await additionalRepository.unlinkProduct(groupId, productId);
    if (result.count === 0) {
      throw new AppError('Vínculo não encontrado.', 404);
    }
  },
};
