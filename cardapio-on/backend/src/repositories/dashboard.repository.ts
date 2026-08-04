import { OrderStatus } from '@prisma/client';
import { orderRepository } from './order.repository.js';

export const dashboardRepository = {
  getMetrics(establishmentId: string, from: Date, to: Date) {
    return Promise.all([
      orderRepository.aggregateRevenue(establishmentId, from, to),
      orderRepository.countByStatus(establishmentId, [
        OrderStatus.NEW,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
        OrderStatus.OUT_FOR_DELIVERY,
      ]),
      orderRepository.countNewCustomers(establishmentId, from, to),
      orderRepository.topProducts(establishmentId, from, to),
      orderRepository.salesByDay(establishmentId, from, to),
      orderRepository.ordersByHour(establishmentId, from, to),
      orderRepository.weeklyRevenue(establishmentId, from, to),
      orderRepository.paymentMethods(establishmentId, from, to),
      orderRepository.findRecent(establishmentId, 10),
    ]);
  },
};
