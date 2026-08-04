import type { Request, Response } from 'express';
import { publicService } from '../services/public.service.js';
import {
  addFavoriteSchema,
  calculateDeliverySchema,
  createPublicOrderSchema,
  favoriteQuerySchema,
  geoAutocompleteQuerySchema,
  geocodeSchema,
  reorderSchema,
  validateCouponSchema,
} from '../validators/public.schemas.js';
import { geoService } from '../services/geo.service.js';
import { serialize } from '../utils/serialize.js';
import { menuEvents, type MenuEvent } from '../lib/menuEvents.js';
import { publicRepository } from '../repositories/public.repository.js';
import { AppError } from '../utils/AppError.js';
import { promotionService } from '../services/promotion.service.js';
import { bannerService } from '../services/banner.service.js';
import { paymentService } from '../services/payment.service.js';
import { orderEvents } from '../lib/orderEvents.js';
import { notificationService } from '../notifications/NotificationService.js';

export const publicController = {
  async getMenu(req: Request, res: Response) {
    const result = await publicService.getMenu(req.params.slug!);
    res.json(serialize(result));
  },

  async getProduct(req: Request, res: Response) {
    const result = await publicService.getProduct(req.params.slug!, req.params.productId!);
    res.json(serialize(result));
  },

  async validateCoupon(req: Request, res: Response) {
    const body = validateCouponSchema.parse(req.body);
    const result = await publicService.validateCoupon(req.params.slug!, body);
    res.json(serialize(result));
  },

  async calculateDelivery(req: Request, res: Response) {
    const body = calculateDeliverySchema.parse(req.body);
    const result = await publicService.calculateDelivery(req.params.slug!, body);
    res.json(serialize(result));
  },

  async createOrder(req: Request, res: Response) {
    const body = createPublicOrderSchema.parse(req.body);
    const establishment = await publicRepository.findEstablishmentBySlug(req.params.slug!);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }

    const result = await publicService.createOrder(req.params.slug!, body);

    orderEvents.publish({
      type: 'order:created',
      establishmentId: establishment.id,
      orderId: result.id,
      code: result.code,
      status: result.status,
    });

    void notificationService.notify('order:new', {
      establishmentId: establishment.id,
      order: result,
    });

    res.status(201).json(serialize(result));
  },

  async trackOrder(req: Request, res: Response) {
    const result = await publicService.trackOrder(req.params.slug!, req.params.code!);
    res.json(serialize(result));
  },

  async getPromotions(req: Request, res: Response) {
    const establishment = await publicRepository.findEstablishmentBySlug(req.params.slug!);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }
    const result = await promotionService.listActiveForPublic(establishment.id);
    res.json(serialize(result));
  },

  async getBanners(req: Request, res: Response) {
    const establishment = await publicRepository.findEstablishmentBySlug(req.params.slug!);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }
    const result = await bannerService.listActiveForPublic(establishment.id);
    res.json(serialize(result));
  },

  async registerBannerView(req: Request, res: Response) {
    await bannerService.registerView(req.params.bannerId!);
    res.status(204).send();
  },

  async registerBannerClick(req: Request, res: Response) {
    await bannerService.registerClick(req.params.bannerId!);
    res.status(204).send();
  },

  async payOrder(req: Request, res: Response) {
    const establishment = await publicRepository.findEstablishmentBySlug(req.params.slug!);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }
    const result = await paymentService.createOrRefreshIntent(establishment.id, req.params.code!);
    res.json(serialize(result));
  },

  async listFavorites(req: Request, res: Response) {
    const query = favoriteQuerySchema.parse(req.query);
    const result = await publicService.listFavorites(req.params.slug!, query.phone);
    res.json(serialize(result));
  },

  async addFavorite(req: Request, res: Response) {
    const body = addFavoriteSchema.parse(req.body);
    const result = await publicService.addFavorite(req.params.slug!, body);
    res.status(201).json(serialize(result));
  },

  async removeFavorite(req: Request, res: Response) {
    const query = favoriteQuerySchema.parse(req.query);
    await publicService.removeFavorite(req.params.slug!, query.phone, req.params.productId!);
    res.status(204).send();
  },

  async customerOrderHistory(req: Request, res: Response) {
    const result = await publicService.customerOrderHistory(req.params.slug!, req.params.phone!);
    res.json(serialize(result));
  },

  async reorder(req: Request, res: Response) {
    const body = reorderSchema.parse(req.body);
    const result = await publicService.reorder(req.params.slug!, body);
    res.json(serialize(result));
  },

  async geoAutocomplete(req: Request, res: Response) {
    const query = geoAutocompleteQuerySchema.parse(req.query);
    const result = await geoService.autocomplete(query.q);
    res.json(serialize(result));
  },

  async geoGeocode(req: Request, res: Response) {
    const body = geocodeSchema.parse(req.body);
    const result = await geoService.geocode(body.address);
    res.json(serialize(result));
  },

  /**
   * Server-Sent Events — cardápio público recebe atualizações em tempo real
   * quando produtos/categorias mudam no painel administrativo.
   */
  async subscribeMenuEvents(req: Request, res: Response) {
    const slug = req.params.slug!;
    const establishment = await publicRepository.findEstablishmentBySlug(slug);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const writeEvent = (event: MenuEvent | { type: string; at: string }) => {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    writeEvent({ type: 'connected', at: new Date().toISOString() });

    const unsubscribe = menuEvents.subscribe((event) => {
      if (event.establishmentId !== establishment.id) return;
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
