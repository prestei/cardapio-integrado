import { EventEmitter } from 'node:events';
import type { OrderStatus } from '@prisma/client';

export type OrderEventType = 'order:created' | 'order:status-changed';

export interface OrderEvent {
  type: OrderEventType;
  establishmentId: string;
  orderId: string;
  code: string;
  status: OrderStatus;
  at: string;
}

class OrderEventBus extends EventEmitter {
  publish(event: Omit<OrderEvent, 'at'>) {
    const fullEvent: OrderEvent = { ...event, at: new Date().toISOString() };
    this.emit('order', fullEvent);
  }

  subscribe(listener: (event: OrderEvent) => void) {
    this.on('order', listener);
    return () => {
      this.off('order', listener);
    };
  }
}

export const orderEvents = new OrderEventBus();
