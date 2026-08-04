import { categoryRepository } from '../repositories/category.repository.js';
import { AppError } from '../utils/AppError.js';
import type {
  CreateCategoryInput,
  ReorderCategoriesInput,
  UpdateCategoryInput,
} from '../validators/category.schemas.js';

export const categoryService = {
  async list(establishmentId: string) {
    return categoryRepository.findAll(establishmentId);
  },

  async getById(id: string, establishmentId: string) {
    const category = await categoryRepository.findById(id, establishmentId);
    if (!category) {
      throw new AppError('Categoria não encontrada.', 404);
    }
    return category;
  },

  async create(establishmentId: string, input: CreateCategoryInput) {
    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
      const max = await categoryRepository.getMaxSortOrder(establishmentId);
      sortOrder = (max._max.sortOrder ?? -1) + 1;
    }

    return categoryRepository.create(establishmentId, {
      ...input,
      imageUrl: input.imageUrl || undefined,
      sortOrder,
    });
  },

  async update(id: string, establishmentId: string, input: UpdateCategoryInput) {
    await this.getById(id, establishmentId);
    const updated = await categoryRepository.update(id, establishmentId, {
      ...input,
      imageUrl: input.imageUrl === '' ? undefined : input.imageUrl,
    });
    return updated;
  },

  async delete(id: string, establishmentId: string) {
    await this.getById(id, establishmentId);
    const result = await categoryRepository.delete(id, establishmentId);
    if (result.count === 0) {
      throw new AppError('Categoria não encontrada.', 404);
    }
  },

  async reorder(establishmentId: string, input: ReorderCategoriesInput) {
    await categoryRepository.reorder(establishmentId, input.items);
    return categoryRepository.findAll(establishmentId);
  },
};
