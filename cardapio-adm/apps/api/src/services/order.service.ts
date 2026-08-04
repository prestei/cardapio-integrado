import { StatusChangeSource, type OrderStatus, type Prisma } from '@prisma/client';
import { orderRepository } from '../repositories/order.repository.js';
import { AppError } from '../utils/AppError.js';
import type { ListOrdersInput, UpdateOrderStatusInput } from '../validators/order.schemas.js';

interface StatusHistoryEntry {
  status: OrderStatus;
  changedAt: string;
  changedBy?: string;
}

interface UpdateStatusUser {
  userId: string;
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError('Data inválida.', 400);
  }
  return date;
}

export const orderService = {
  async list(establishmentId: string, filters: ListOrdersInput) {
    return orderRepository.findAll(establishmentId, {
      status: filters.status,
      type: filters.type,
      search: filters.search,
      from: parseDate(filters.from),
      to: parseDate(filters.to),
    });
  },

  async getById(id: string, establishmentId: string) {
    const order = await orderRepository.findById(id, establishmentId);
    if (!order) {
      throw new AppError('Pedido não encontrado.', 404);
    }
    return order;
  },

  async updateStatus(
    id: string,
    establishmentId: string,
    input: UpdateOrderStatusInput,
    user?: UpdateStatusUser,
  ) {
    const order = await this.getById(id, establishmentId);

    const history = Array.isArray(order.statusHistory)
      ? (order.statusHistory as unknown as StatusHistoryEntry[])
      : [];

    const newEntry: StatusHistoryEntry = {
      status: input.status,
      changedAt: new Date().toISOString(),
      ...(user?.userId ? { changedBy: user.userId } : {}),
    };

    history.push(newEntry);

    const [updated] = await Promise.all([
      orderRepository.updateStatus(
        id,
        establishmentId,
        input.status,
        history as unknown as Prisma.InputJsonValue,
      ),
      orderRepository.createStatusHistoryEntry({
        establishmentId,
        orderId: id,
        fromStatus: order.status,
        toStatus: input.status,
        userId: user?.userId ?? null,
        source: StatusChangeSource.PANEL,
      }),
    ]);

    if (!updated) {
      throw new AppError('Pedido não encontrado.', 404);
    }

    return updated;
  },
};
