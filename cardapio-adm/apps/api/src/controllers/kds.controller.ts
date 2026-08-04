import type { Request, Response } from 'express';
import { orderRepository } from '../repositories/order.repository.js';
import { serialize } from '../utils/serialize.js';
import { orderEvents, type OrderEvent } from '../lib/orderEvents.js';

export const kdsController = {
  async list(req: Request, res: Response) {
    const result = await orderRepository.findActiveForKds(req.user!.establishmentId);
    res.json(serialize(result));
  },

  /**
   * Server-Sent Events autenticado — painel KDS/pedidos recebe atualizações
   * em tempo real de criação e mudança de status, filtradas pelo estabelecimento.
   */
  async subscribeEvents(req: Request, res: Response) {
    const establishmentId = req.user!.establishmentId;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const writeEvent = (event: OrderEvent | { type: string; at: string }) => {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    writeEvent({ type: 'connected', at: new Date().toISOString() });

    const unsubscribe = orderEvents.subscribe((event) => {
      if (event.establishmentId !== establishmentId) return;
      writeEvent(event);
    });

    const heartbeat = setInterval(() => {
      res.write(`: ping ${Date.now()}\n\n`);
    }, 25_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    });
  },
};
