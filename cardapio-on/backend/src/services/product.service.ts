import { productRepository } from '../repositories/product.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { AppError } from '../utils/AppError.js';
import type {
  CreateProductInput,
  UpdateProductInput,
  UpdateProductPriceInput,
} from '../validators/product.schemas.js';

export const productService = {
  async list(establishmentId: string, categoryId?: string) {
    return productRepository.findAll(establishmentId, categoryId);
  },

  async getById(id: string, establishmentId: string) {
    const product = await productRepository.findById(id, establishmentId);
    if (!product) {
      throw new AppError('Produto não encontrado.', 404);
    }
    return product;
  },

  async create(establishmentId: string, input: CreateProductInput) {
    const category = await categoryRepository.findById(input.categoryId, establishmentId);
    if (!category) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
      const max = await productRepository.getMaxSortOrder(establishmentId, input.categoryId);
      sortOrder = (max._max.sortOrder ?? -1) + 1;
    }

    return productRepository.create(establishmentId, {
      ...input,
      imageUrl: input.imageUrl || undefined,
      sortOrder,
    });
  },

  async update(id: string, establishmentId: string, input: UpdateProductInput) {
    await this.getById(id, establishmentId);

    if (input.categoryId) {
      const category = await categoryRepository.findById(input.categoryId, establishmentId);
      if (!category) {
        throw new AppError('Categoria não encontrada.', 404);
      }
    }

    const updated = await productRepository.update(id, establishmentId, {
      ...input,
      imageUrl: input.imageUrl === '' ? undefined : input.imageUrl,
    });
    return updated;
  },

  async delete(id: string, establishmentId: string) {
    await this.getById(id, establishmentId);
    const result = await productRepository.delete(id, establishmentId);
    if (result.count === 0) {
      throw new AppError('Produto não encontrado.', 404);
    }
  },

  async duplicate(id: string, establishmentId: string) {
    const copy = await productRepository.duplicate(id, establishmentId);
    if (!copy) {
      throw new AppError('Produto não encontrado.', 404);
    }
    return copy;
  },

  async updatePrice(id: string, establishmentId: string, input: UpdateProductPriceInput) {
    await this.getById(id, establishmentId);
    const updated = await productRepository.updatePrice(
      id,
      establishmentId,
      input.price,
      input.promoPrice,
    );
    return updated;
  },
};
