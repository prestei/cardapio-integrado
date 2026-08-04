import { deliveryRepository } from '../repositories/delivery.repository.js';
import { AppError } from '../utils/AppError.js';
import type {
  AssignCourierInput,
  CreateDeliveryZoneInput,
  ListDeliveriesQuery,
  UpdateDeliveryTimesInput,
  UpdateDeliveryZoneInput,
} from '../validators/delivery.schemas.js';

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError('Data inválida.', 400);
  }
  return date;
}

export const deliveryService = {
  async listZones(establishmentId: string) {
    return deliveryRepository.findZones(establishmentId);
  },

  async getZone(id: string, establishmentId: string) {
    const zone = await deliveryRepository.findZoneById(id, establishmentId);
    if (!zone) {
      throw new AppError('Zona de entrega não encontrada.', 404);
    }
    return zone;
  },

  async createZone(establishmentId: string, input: CreateDeliveryZoneInput) {
    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
      const max = await deliveryRepository.getMaxZoneSortOrder(establishmentId);
      sortOrder = (max._max.sortOrder ?? -1) + 1;
    }
    return deliveryRepository.createZone(establishmentId, { ...input, sortOrder });
  },

  async updateZone(id: string, establishmentId: string, input: UpdateDeliveryZoneInput) {
    await this.getZone(id, establishmentId);
    return deliveryRepository.update(id, establishmentId, input);
  },

  async deleteZone(id: string, establishmentId: string) {
    await this.getZone(id, establishmentId);
    const result = await deliveryRepository.deleteZone(id, establishmentId);
    if (result.count === 0) {
      throw new AppError('Zona de entrega não encontrada.', 404);
    }
  },

  async listDeliveries(establishmentId: string, filters: ListDeliveriesQuery) {
    return deliveryRepository.findDeliveryOrders(establishmentId, {
      status: filters.status,
      search: filters.search,
      from: parseDate(filters.from),
      to: parseDate(filters.to),
      unassignedOnly: filters.unassignedOnly,
    });
  },

  async getDelivery(id: string, establishmentId: string) {
    const order = await deliveryRepository.findDeliveryOrderById(id, establishmentId);
    if (!order) {
      throw new AppError('Entrega não encontrada.', 404);
    }
    return order;
  },

  async assignCourier(id: string, establishmentId: string, input: AssignCourierInput) {
    await this.getDelivery(id, establishmentId);

    if (input.courierId) {
      const courier = await deliveryRepository.findCourier(input.courierId, establishmentId);
      if (!courier) {
        throw new AppError('Entregador não encontrado.', 404);
      }
    }

    return deliveryRepository.assignCourier(id, establishmentId, input.courierId);
  },

  async updateTimes(id: string, establishmentId: string, input: UpdateDeliveryTimesInput) {
    await this.getDelivery(id, establishmentId);

    return deliveryRepository.updateTimes(id, establishmentId, {
      deliveryLeftAt:
        input.deliveryLeftAt !== undefined
          ? input.deliveryLeftAt === null
            ? null
            : new Date(input.deliveryLeftAt)
          : undefined,
      deliveryCompletedAt:
        input.deliveryCompletedAt !== undefined
          ? input.deliveryCompletedAt === null
            ? null
            : new Date(input.deliveryCompletedAt)
          : undefined,
    });
  },
};
