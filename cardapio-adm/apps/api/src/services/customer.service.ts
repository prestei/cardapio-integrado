import { customerRepository } from '../repositories/customer.repository.js';
import { AppError } from '../utils/AppError.js';
import type { ListCustomersQuery, UpdateCustomerInput } from '../validators/customer.schemas.js';

export const customerService = {
  async list(establishmentId: string, filters: ListCustomersQuery) {
    const { items, total } = await customerRepository.findAll(establishmentId, {
      search: filters.search,
      isActive: filters.isActive,
      page: filters.page,
      pageSize: filters.pageSize,
    });

    const stats = await customerRepository.orderStatsByCustomerIds(
      establishmentId,
      items.map((c) => c.id),
    );

    return {
      items: items.map((customer) => ({
        ...customer,
        stats: stats.get(customer.id) ?? {
          totalOrders: 0,
          totalSpent: 0,
          lastOrderAt: null,
        },
      })),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize) || 1,
      },
    };
  },

  async getById(id: string, establishmentId: string) {
    const customer = await customerRepository.findById(id, establishmentId);
    if (!customer) {
      throw new AppError('Cliente não encontrado.', 404);
    }

    const stats = await customerRepository.orderStatsByCustomerIds(establishmentId, [id]);

    return {
      ...customer,
      stats: stats.get(id) ?? { totalOrders: 0, totalSpent: 0, lastOrderAt: null },
    };
  },

  async update(id: string, establishmentId: string, input: UpdateCustomerInput) {
    const customer = await customerRepository.findById(id, establishmentId);
    if (!customer) {
      throw new AppError('Cliente não encontrado.', 404);
    }

    if (input.phone && input.phone !== customer.phone) {
      const existing = await customerRepository.findByPhone(establishmentId, input.phone);
      if (existing && existing.id !== id) {
        throw new AppError('Já existe um cliente com este telefone.', 409);
      }
    }

    return customerRepository.update(id, establishmentId, {
      ...input,
      email: input.email === '' ? null : input.email,
    });
  },
};
