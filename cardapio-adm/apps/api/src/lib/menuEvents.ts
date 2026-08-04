import { EventEmitter } from 'node:events';

export type MenuEventType =
  | 'menu:updated'
  | 'product:created'
  | 'product:updated'
  | 'product:deleted'
  | 'product:availability-changed'
  | 'category:created'
  | 'category:updated'
  | 'category:deleted';

export interface MenuEvent {
  type: MenuEventType;
  establishmentId: string;
  at: string;
}

class MenuEventBus extends EventEmitter {
  publish(type: MenuEventType, establishmentId: string) {
    const event: MenuEvent = {
      type,
      establishmentId,
      at: new Date().toISOString(),
    };
    this.emit('menu', event);
    // Always also emit a generic refresh signal for subscribers
    if (type !== 'menu:updated') {
      this.emit('menu', {
        type: 'menu:updated',
        establishmentId,
        at: event.at,
      } satisfies MenuEvent);
    }
  }

  subscribe(listener: (event: MenuEvent) => void) {
    this.on('menu', listener);
    return () => {
      this.off('menu', listener);
    };
  }
}

export const menuEvents = new MenuEventBus();
