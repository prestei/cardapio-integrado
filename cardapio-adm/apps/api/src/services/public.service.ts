import {
  CouponType,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  SelectionType,
} from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { publicRepository } from '../repositories/public.repository.js';
import { AppError } from '../utils/AppError.js';
import type {
  CalculateDeliveryInput,
  CreatePublicOrderInput,
  ValidateCouponInput,
} from '../validators/public.schemas.js';
import { normalizeMenuSections } from '../utils/menuSections.js';

interface StatusHistoryEntry {
  status: OrderStatus;
  changedAt: string;
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function isWithinHours(
  openTime: string | null | undefined,
  closeTime: string | null | undefined,
  breakStart: string | null | undefined,
  breakEnd: string | null | undefined,
  nowMinutes: number,
): boolean {
  if (!openTime || !closeTime) return false;

  const open = parseTimeToMinutes(openTime);
  let close = parseTimeToMinutes(closeTime);
  // Overnight closing (e.g. 18:00–01:00)
  if (close <= open) close += 24 * 60;

  let current = nowMinutes;
  if (current < open) current += 24 * 60;

  if (current < open || current >= close) return false;

  if (breakStart && breakEnd) {
    const bs = parseTimeToMinutes(breakStart);
    const be = parseTimeToMinutes(breakEnd);
    const adjustedNow = nowMinutes < open ? nowMinutes + 24 * 60 : nowMinutes;
    if (adjustedNow >= bs && adjustedNow < be) return false;
  }

  return true;
}

function computeOpenStatus(
  isOpenFlag: boolean,
  businessHours: Array<{
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    breakStart: string | null;
    breakEnd: string | null;
    isClosed: boolean;
  }>,
) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const today = businessHours.find((h) => h.dayOfWeek === dayOfWeek);

  if (!isOpenFlag) {
    return {
      isOpenNow: false,
      reason: 'manual' as const,
      todayHours: today ?? null,
      nextOpen: findNextOpen(businessHours, dayOfWeek, nowMinutes),
    };
  }

  if (!today || today.isClosed) {
    return {
      isOpenNow: false,
      reason: 'closed_day' as const,
      todayHours: today ?? null,
      nextOpen: findNextOpen(businessHours, dayOfWeek, nowMinutes),
    };
  }

  const openNow = isWithinHours(
    today.openTime,
    today.closeTime,
    today.breakStart,
    today.breakEnd,
    nowMinutes,
  );

  return {
    isOpenNow: openNow,
    reason: openNow ? ('open' as const) : ('outside_hours' as const),
    todayHours: today,
    nextOpen: openNow
      ? null
      : findNextOpen(businessHours, dayOfWeek, nowMinutes),
  };
}

function findNextOpen(
  businessHours: Array<{
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }>,
  currentDay: number,
  _nowMinutes: number,
) {
  for (let offset = 0; offset < 7; offset++) {
    const day = (currentDay + offset) % 7;
    const hours = businessHours.find((h) => h.dayOfWeek === day);
    if (!hours || hours.isClosed || !hours.openTime) continue;
    if (offset === 0) {
      const open = parseTimeToMinutes(hours.openTime);
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      if (nowMin < open) {
        return { dayOfWeek: day, openTime: hours.openTime };
      }
      continue;
    }
    return { dayOfWeek: day, openTime: hours.openTime };
  }
  return null;
}

function unitPrice(product: { price: Prisma.Decimal; promoPrice: Prisma.Decimal | null }) {
  return product.promoPrice != null ? Number(product.promoPrice) : Number(product.price);
}

interface ValidateCouponRulesOptions {
  deliveryFee?: number;
  customerUsageCount?: number;
}

function validateCouponRules(
  coupon: {
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
    usageLimit: number | null;
    usageCount: number;
    perCustomerLimit: number | null;
    minOrderValue: Prisma.Decimal | null;
    type: CouponType;
    value: Prisma.Decimal;
    code: string;
    id: string;
    description: string | null;
  },
  subtotal: number,
  options: ValidateCouponRulesOptions = {},
) {
  if (!coupon.isActive) {
    throw new AppError('Cupom inativo.', 400);
  }

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) {
    throw new AppError('Cupom ainda não está válido.', 400);
  }
  if (coupon.endsAt && now > coupon.endsAt) {
    throw new AppError('Cupom expirado.', 400);
  }
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    throw new AppError('Cupom esgotado.', 400);
  }
  if (
    coupon.perCustomerLimit != null &&
    options.customerUsageCount != null &&
    options.customerUsageCount >= coupon.perCustomerLimit
  ) {
    throw new AppError('Você já utilizou este cupom o número máximo de vezes permitido.', 400);
  }
  if (coupon.minOrderValue != null && subtotal < Number(coupon.minOrderValue)) {
    throw new AppError(
      `Pedido mínimo de R$ ${Number(coupon.minOrderValue).toFixed(2)} para este cupom.`,
      400,
    );
  }

  const deliveryFee = options.deliveryFee ?? 0;
  let discount = 0;
  let freeDelivery = false;

  if (coupon.type === CouponType.PERCENTAGE) {
    discount = subtotal * (Number(coupon.value) / 100);
    discount = Math.min(discount, subtotal);
  } else if (coupon.type === CouponType.FREE_DELIVERY) {
    discount = deliveryFee;
    freeDelivery = true;
  } else {
    discount = Math.min(Number(coupon.value), subtotal);
  }

  return {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: Number(coupon.value),
    discount: Math.round(discount * 100) / 100,
    freeDelivery,
  };
}

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

interface ScheduleSettingsLike {
  allowScheduledOrders: boolean;
  scheduleMinLeadMinutes: number;
  scheduleMaxDaysAhead: number;
  scheduleSlotMinutes: number;
  scheduleMaxPerSlot: number | null;
}

interface BusinessHoursLike {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  isClosed: boolean;
}

function validateScheduledOrder(
  settings: ScheduleSettingsLike | null | undefined,
  businessHours: BusinessHoursLike[],
  scheduledForRaw: string,
): Date {
  if (!settings?.allowScheduledOrders) {
    throw new AppError('Agendamento de pedidos não está disponível neste estabelecimento.', 400);
  }

  const scheduledFor = new Date(scheduledForRaw);
  if (Number.isNaN(scheduledFor.getTime())) {
    throw new AppError('Data de agendamento inválida.', 400);
  }

  const now = new Date();
  const minLeadMinutes = settings.scheduleMinLeadMinutes ?? 60;
  const minAllowed = new Date(now.getTime() + minLeadMinutes * 60 * 1000);
  if (scheduledFor < minAllowed) {
    throw new AppError(
      `O agendamento deve ser feito com pelo menos ${minLeadMinutes} minutos de antecedência.`,
      400,
    );
  }

  const maxDaysAhead = settings.scheduleMaxDaysAhead ?? 7;
  const maxAllowed = new Date(now.getTime() + maxDaysAhead * 24 * 60 * 60 * 1000);
  if (scheduledFor > maxAllowed) {
    throw new AppError(
      `Agendamentos podem ser feitos com no máximo ${maxDaysAhead} dias de antecedência.`,
      400,
    );
  }

  const dayOfWeek = scheduledFor.getDay();
  const todayHours = businessHours.find((h) => h.dayOfWeek === dayOfWeek);
  if (
    !todayHours ||
    todayHours.isClosed ||
    !isWithinHours(
      todayHours.openTime,
      todayHours.closeTime,
      todayHours.breakStart,
      todayHours.breakEnd,
      minutesOfDay(scheduledFor),
    )
  ) {
    throw new AppError('O horário escolhido está fora do funcionamento do estabelecimento.', 400);
  }

  const slotMinutes = settings.scheduleSlotMinutes ?? 30;
  if (minutesOfDay(scheduledFor) % slotMinutes !== 0) {
    throw new AppError(`Escolha um horário alinhado a intervalos de ${slotMinutes} minutos.`, 400);
  }

  return scheduledFor;
}

function nextCode(lastCode: string | undefined): string {
  if (!lastCode) return '#1001';
  const digits = lastCode.replace(/\D/g, '');
  const num = Number(digits || '1000') + 1;
  return `#${num}`;
}

function mapAdditionalGroups(
  links: Array<{
    additionalGroup: {
      id: string;
      name: string;
      selectionType: SelectionType;
      isRequired: boolean;
      minQuantity: number;
      maxQuantity: number;
      sortOrder: number;
      isActive: boolean;
      additionals: Array<{
        id: string;
        name: string;
        price: Prisma.Decimal;
        isAvailable: boolean;
        sortOrder: number;
      }>;
    } | null;
  }>,
) {
  return links
    .map((link) => link.additionalGroup)
    .filter((g): g is NonNullable<typeof g> => Boolean(g && g.isActive))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((group) => ({
      id: group.id,
      name: group.name,
      selectionType: group.selectionType,
      isRequired: group.isRequired,
      minQuantity: group.minQuantity,
      maxQuantity: group.maxQuantity,
      sortOrder: group.sortOrder,
      additionals: group.additionals.map((a) => ({
        id: a.id,
        name: a.name,
        price: Number(a.price),
        sortOrder: a.sortOrder,
      })),
    }));
}

export const publicService = {
  async getMenu(slug: string) {
    const establishment = await publicRepository.findEstablishmentBySlug(slug);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }

    const categories = await publicRepository.findMenu(establishment.id);
    const openStatus = computeOpenStatus(establishment.isOpen, establishment.businessHours);
    const settings = establishment.settings;

    const paymentMethods: PaymentMethod[] = [];
    if (settings?.acceptPix) paymentMethods.push(PaymentMethod.PIX);
    if (settings?.acceptCash) paymentMethods.push(PaymentMethod.CASH);
    if (settings?.acceptCard) paymentMethods.push(PaymentMethod.CARD);
    if (settings?.acceptOnline) paymentMethods.push(PaymentMethod.ONLINE);

    return {
      establishment: {
        id: establishment.id,
        name: establishment.name,
        slug: establishment.slug,
        description: establishment.description,
        phone: establishment.phone,
        whatsapp: establishment.whatsapp,
        address: establishment.address,
        logoUrl: establishment.logoUrl,
        bannerUrl: establishment.bannerUrl,
        primaryColor: establishment.primaryColor,
        secondaryColor: establishment.secondaryColor,
        isOpen: establishment.isOpen,
      },
      openStatus,
      sections: normalizeMenuSections(settings?.menuSectionsJson),
      settings: {
        minOrderValue: settings?.minOrderValue != null ? Number(settings.minOrderValue) : null,
        estimatedMinutes: settings?.estimatedMinutes ?? null,
        freeDeliveryAbove:
          settings?.freeDeliveryAbove != null ? Number(settings.freeDeliveryAbove) : null,
        deliveryFeeType: settings?.deliveryFeeType ?? 'FIXED',
        fixedDeliveryFee:
          settings?.fixedDeliveryFee != null ? Number(settings.fixedDeliveryFee) : null,
        acceptDelivery: settings?.acceptDelivery ?? true,
        acceptPickup: settings?.acceptPickup ?? true,
        acceptDineIn: settings?.acceptDineIn ?? true,
        paymentMethods,
        allowScheduledOrders: settings?.allowScheduledOrders ?? false,
        scheduleMinLeadMinutes: settings?.scheduleMinLeadMinutes ?? 60,
        scheduleMaxDaysAhead: settings?.scheduleMaxDaysAhead ?? 7,
        scheduleSlotMinutes: settings?.scheduleSlotMinutes ?? 30,
        scheduleMaxPerSlot: settings?.scheduleMaxPerSlot ?? null,
      },
      businessHours: establishment.businessHours,
      deliveryZones: establishment.deliveryZones.map((z) => ({
        id: z.id,
        name: z.name,
        fee: Number(z.fee),
        estimatedMinutes: z.estimatedMinutes,
      })),
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        products: cat.products.map((product) => ({
          id: product.id,
          categoryId: product.categoryId,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          promoPrice: product.promoPrice != null ? Number(product.promoPrice) : null,
          imageUrl: product.imageUrl ?? product.images[0]?.url ?? null,
          prepTimeMinutes: product.prepTimeMinutes,
          isAvailable: product.isAvailable,
          isFeatured: product.isFeatured,
          sortOrder: product.sortOrder,
          hasAdditionals: product.additionalGroups.length > 0,
        })),
      })),
      featuredProducts: categories
        .flatMap((c) => c.products)
        .filter((p) => p.isFeatured)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((product) => ({
          id: product.id,
          categoryId: product.categoryId,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          promoPrice: product.promoPrice != null ? Number(product.promoPrice) : null,
          imageUrl: product.imageUrl ?? product.images[0]?.url ?? null,
          isAvailable: product.isAvailable,
          isFeatured: true,
          sortOrder: product.sortOrder,
          hasAdditionals: product.additionalGroups.length > 0,
        })),
    };
  },

  async getProduct(slug: string, productId: string) {
    const establishment = await publicRepository.findEstablishmentBySlug(slug);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }

    const product = await publicRepository.findProduct(productId, establishment.id);
    if (!product) {
      throw new AppError('Produto não encontrado.', 404);
    }

    return {
      id: product.id,
      categoryId: product.categoryId,
      category: product.category,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      promoPrice: product.promoPrice != null ? Number(product.promoPrice) : null,
      imageUrl: product.imageUrl,
      images: product.images.map((img) => ({ id: img.id, url: img.url, sortOrder: img.sortOrder })),
      prepTimeMinutes: product.prepTimeMinutes,
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      additionalGroups: mapAdditionalGroups(product.additionalGroups),
    };
  },

  async validateCoupon(slug: string, input: ValidateCouponInput) {
    const establishment = await publicRepository.findEstablishmentBySlug(slug);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }

    const coupon = await publicRepository.findCouponByCode(establishment.id, input.code.trim());
    if (!coupon) {
      throw new AppError('Cupom inválido.', 404);
    }

    let customerUsageCount: number | undefined;
    if (coupon.perCustomerLimit != null && input.customerPhone) {
      const phone = input.customerPhone.replace(/\D/g, '');
      const customer = await publicRepository.findCustomerByPhone(establishment.id, phone);
      if (customer) {
        customerUsageCount = await publicRepository.countCouponUsagesForCustomer(
          coupon.id,
          customer.id,
        );
      }
    }

    return validateCouponRules(coupon, input.subtotal ?? 0, {
      deliveryFee: input.deliveryFee,
      customerUsageCount,
    });
  },

  async calculateDelivery(slug: string, input: CalculateDeliveryInput) {
    const establishment = await publicRepository.findEstablishmentBySlug(slug);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }

    const settings = establishment.settings;
    const subtotal = input.subtotal ?? 0;
    const freeAbove =
      settings?.freeDeliveryAbove != null ? Number(settings.freeDeliveryAbove) : null;

    if (freeAbove != null && subtotal >= freeAbove) {
      return {
        fee: 0,
        estimatedMinutes: settings?.estimatedMinutes ?? null,
        freeDelivery: true,
        zone: null,
      };
    }

    if (settings?.deliveryFeeType === 'ZONE') {
      const zone = await publicRepository.findDeliveryZone(
        establishment.id,
        input.neighborhood.trim(),
      );
      if (!zone) {
        throw new AppError('Bairro não atendido para entrega.', 400);
      }
      return {
        fee: Number(zone.fee),
        estimatedMinutes: zone.estimatedMinutes ?? settings?.estimatedMinutes ?? null,
        freeDelivery: false,
        zone: { id: zone.id, name: zone.name },
      };
    }

    return {
      fee: settings?.fixedDeliveryFee != null ? Number(settings.fixedDeliveryFee) : 0,
      estimatedMinutes: settings?.estimatedMinutes ?? null,
      freeDelivery: false,
      zone: null,
    };
  },

  async createOrder(slug: string, input: CreatePublicOrderInput) {
    const establishment = await publicRepository.findEstablishmentBySlug(slug);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }

    const settings = establishment.settings;
    let scheduledFor: Date | null = null;

    if (input.scheduledFor) {
      scheduledFor = validateScheduledOrder(settings, establishment.businessHours, input.scheduledFor);

      if (settings?.scheduleMaxPerSlot) {
        const slotMinutes = settings.scheduleSlotMinutes ?? 30;
        const bucketMinutes = Math.floor(minutesOfDay(scheduledFor) / slotMinutes) * slotMinutes;
        const slotStart = new Date(scheduledFor);
        slotStart.setHours(0, bucketMinutes, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60 * 1000);

        const countInSlot = await publicRepository.countScheduledOrdersInSlot(
          establishment.id,
          slotStart,
          slotEnd,
        );
        if (countInSlot >= settings.scheduleMaxPerSlot) {
          throw new AppError('Este horário está lotado. Escolha outro horário.', 400);
        }
      }
    } else {
      const openStatus = computeOpenStatus(establishment.isOpen, establishment.businessHours);
      if (!openStatus.isOpenNow) {
        throw new AppError('Estamos fechados no momento. Não é possível finalizar o pedido.', 400);
      }
    }
    const paymentMethods: PaymentMethod[] = [];
    if (settings?.acceptPix) paymentMethods.push(PaymentMethod.PIX);
    if (settings?.acceptCash) paymentMethods.push(PaymentMethod.CASH);
    if (settings?.acceptCard) paymentMethods.push(PaymentMethod.CARD);
    if (settings?.acceptOnline) paymentMethods.push(PaymentMethod.ONLINE);

    if (!paymentMethods.includes(input.paymentMethod)) {
      throw new AppError('Forma de pagamento não aceita.', 400);
    }

    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, establishmentId: establishment.id },
      include: {
        additionalGroups: {
          include: {
            additionalGroup: {
              include: { additionals: true },
            },
          },
        },
      },
    });

    if (products.length !== productIds.length) {
      throw new AppError('Um ou mais produtos são inválidos.', 400);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;

    const resolvedItems = input.items.map((item) => {
      const product = productMap.get(item.productId)!;
      if (!product.isAvailable) {
        throw new AppError(`O produto "${product.name}" está indisponível.`, 400);
      }

      const groups = mapAdditionalGroups(product.additionalGroups);
      const selectedCounts = new Map<string, number>();
      const resolvedAdditionals: Array<{
        additionalId: string;
        name: string;
        price: number;
        groupId: string;
      }> = [];

      for (const sel of item.additionals) {
        let found:
          | { additionalId: string; name: string; price: number; groupId: string }
          | undefined;

        for (const group of groups) {
          const add = group.additionals.find((a) => a.id === sel.additionalId);
          if (add) {
            found = {
              additionalId: add.id,
              name: add.name,
              price: add.price,
              groupId: group.id,
            };
            break;
          }
        }

        if (!found) {
          throw new AppError('Adicional inválido para o produto.', 400);
        }

        const qty = sel.quantity ?? 1;
        selectedCounts.set(found.groupId, (selectedCounts.get(found.groupId) ?? 0) + qty);

        for (let i = 0; i < qty; i++) {
          resolvedAdditionals.push(found);
        }
      }

      for (const group of groups) {
        const count = selectedCounts.get(group.id) ?? 0;
        if (group.isRequired && count < Math.max(group.minQuantity, 1)) {
          throw new AppError(`Selecione as opções de "${group.name}".`, 400);
        }
        if (!group.isRequired && group.minQuantity > 0 && count < group.minQuantity) {
          throw new AppError(
            `Selecione ao menos ${group.minQuantity} opção(ões) em "${group.name}".`,
            400,
          );
        }
        if (count > group.maxQuantity) {
          throw new AppError(
            `Máximo de ${group.maxQuantity} opção(ões) em "${group.name}".`,
            400,
          );
        }
        if (group.selectionType === SelectionType.SINGLE && count > 1) {
          throw new AppError(`Selecione apenas uma opção em "${group.name}".`, 400);
        }
      }

      const base = unitPrice(product);
      const addsTotal = resolvedAdditionals.reduce((sum, a) => sum + a.price, 0);
      const lineUnit = base + addsTotal;
      const lineTotal = lineUnit * item.quantity;
      subtotal += lineTotal;

      return {
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice: lineUnit,
        total: lineTotal,
        notes: item.notes,
        additionals: resolvedAdditionals,
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;

    const minOrder =
      settings?.minOrderValue != null ? Number(settings.minOrderValue) : null;
    if (minOrder != null && subtotal < minOrder && input.type === OrderType.DELIVERY) {
      throw new AppError(`Pedido mínimo de R$ ${minOrder.toFixed(2)}.`, 400);
    }

    let deliveryFee = 0;
    if (input.type === OrderType.DELIVERY) {
      const delivery = await this.calculateDelivery(slug, {
        neighborhood: input.address!.neighborhood,
        subtotal,
      });
      deliveryFee = delivery.fee;
    }

    let discount = 0;
    let couponId: string | undefined;
    if (input.couponCode) {
      const coupon = await publicRepository.findCouponByCode(
        establishment.id,
        input.couponCode.trim(),
      );
      if (!coupon) {
        throw new AppError('Cupom inválido.', 400);
      }

      let customerUsageCount: number | undefined;
      if (coupon.perCustomerLimit != null) {
        const existingCustomer = await publicRepository.findCustomerByPhone(
          establishment.id,
          input.customer.phone.replace(/\D/g, ''),
        );
        if (existingCustomer) {
          customerUsageCount = await publicRepository.countCouponUsagesForCustomer(
            coupon.id,
            existingCustomer.id,
          );
        }
      }

      const validated = validateCouponRules(coupon, subtotal, {
        deliveryFee,
        customerUsageCount,
      });
      discount = validated.discount;
      couponId = validated.id;
    }

    const total = Math.round(Math.max(subtotal + deliveryFee - discount, 0) * 100) / 100;

    if (
      input.paymentMethod === PaymentMethod.CASH &&
      input.changeFor != null &&
      input.changeFor < total
    ) {
      throw new AppError('O valor para troco deve ser maior ou igual ao total.', 400);
    }

    const lastOrder = await publicRepository.getNextOrderCode(establishment.id);
    const code = nextCode(lastOrder?.code);

    const phone = input.customer.phone.replace(/\D/g, '');
    const notesParts = [
      input.notes,
      input.paymentMethod === PaymentMethod.CASH && input.changeFor
        ? `Troco para R$ ${input.changeFor.toFixed(2)}`
        : null,
      input.address?.reference ? `Ref: ${input.address.reference}` : null,
    ].filter(Boolean);

    const order = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: {
          establishmentId_phone: {
            establishmentId: establishment.id,
            phone,
          },
        },
        create: {
          establishmentId: establishment.id,
          name: input.customer.name.trim(),
          phone,
        },
        update: {
          name: input.customer.name.trim(),
        },
      });

      let addressId: string | undefined;
      if (input.type === OrderType.DELIVERY && input.address) {
        const address = await tx.address.create({
          data: {
            customerId: customer.id,
            street: input.address.street,
            number: input.address.number,
            complement: input.address.complement,
            neighborhood: input.address.neighborhood,
            city: input.address.city,
            state: input.address.state,
            zipCode: input.address.zipCode,
            isDefault: true,
          },
        });
        addressId = address.id;
      }

      const statusHistory: StatusHistoryEntry[] = [
        { status: OrderStatus.NEW, changedAt: new Date().toISOString() },
      ];

      const created = await tx.order.create({
        data: {
          establishmentId: establishment.id,
          customerId: customer.id,
          addressId,
          code,
          type: input.type,
          status: OrderStatus.NEW,
          subtotal,
          deliveryFee,
          discount,
          total,
          notes: notesParts.length ? notesParts.join(' | ') : null,
          couponId,
          isScheduled: Boolean(scheduledFor),
          scheduledFor,
          statusHistory: statusHistory as unknown as Prisma.InputJsonValue,
          items: {
            create: resolvedItems.map((item) => ({
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              notes: item.notes,
              additionals: {
                create: item.additionals.map((a) => ({
                  additionalId: a.additionalId,
                  name: a.name,
                  price: a.price,
                })),
              },
            })),
          },
          payment: {
            create: {
              method: input.paymentMethod,
              status: PaymentStatus.PENDING,
              amount: total,
            },
          },
        },
        include: {
          customer: { select: { name: true, phone: true } },
          payment: true,
          items: { include: { additionals: true } },
        },
      });

      if (couponId) {
        await tx.couponUsage.create({
          data: {
            couponId,
            orderId: created.id,
            customerId: customer.id,
          },
        });
        await tx.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      await tx.notification.create({
        data: {
          establishmentId: establishment.id,
          title: 'Novo pedido',
          message: `Pedido ${code} aguardando confirmação.`,
          type: 'order',
        },
      });

      return created;
    });

    return {
      id: order.id,
      code: order.code,
      status: order.status,
      type: order.type,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      discount: Number(order.discount),
      total: Number(order.total),
      notes: order.notes,
      isScheduled: order.isScheduled,
      scheduledFor: order.scheduledFor,
      createdAt: order.createdAt,
      customer: order.customer,
      payment: order.payment
        ? {
            method: order.payment.method,
            status: order.payment.status,
            amount: Number(order.payment.amount),
          }
        : null,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
        notes: item.notes,
        additionals: item.additionals.map((a) => ({
          name: a.name,
          price: Number(a.price),
        })),
      })),
      establishment: {
        name: establishment.name,
        whatsapp: establishment.whatsapp,
        phone: establishment.phone,
        estimatedMinutes: settings?.estimatedMinutes ?? null,
      },
    };
  },

  async trackOrder(slug: string, code: string) {
    const establishment = await publicRepository.findEstablishmentBySlug(slug);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }

    const order = await publicRepository.findOrderByCode(establishment.id, code);
    if (!order) {
      throw new AppError('Pedido não encontrado.', 404);
    }

    return {
      code: order.code,
      status: order.status,
      type: order.type,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      discount: Number(order.discount),
      total: Number(order.total),
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      statusHistory: order.statusHistory,
      customer: order.customer
        ? { name: order.customer.name }
        : null,
      address: order.address,
      payment: order.payment
        ? {
            method: order.payment.method,
            status: order.payment.status,
            amount: Number(order.payment.amount),
          }
        : null,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
        notes: item.notes,
        imageUrl: item.product?.imageUrl ?? null,
        additionals: item.additionals.map((a) => ({
          name: a.name,
          price: Number(a.price),
        })),
      })),
      establishment: {
        name: establishment.name,
        whatsapp: establishment.whatsapp,
        phone: establishment.phone,
        primaryColor: establishment.primaryColor,
        logoUrl: establishment.logoUrl,
        estimatedMinutes: establishment.settings?.estimatedMinutes ?? null,
      },
    };
  },

  async listFavorites(slug: string, phone: string) {
    const establishment = await publicRepository.findEstablishmentBySlug(slug);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }

    const normalizedPhone = phone.replace(/\D/g, '');
    const favorites = await publicRepository.listFavorites(establishment.id, normalizedPhone);

    return favorites
      .filter((f) => Boolean(f.product))
      .map((f) => {
        const product = f.product!;
        return {
          id: f.id,
          productId: f.productId,
          createdAt: f.createdAt,
          product: {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            promoPrice: product.promoPrice != null ? Number(product.promoPrice) : null,
            imageUrl: product.imageUrl ?? product.images[0]?.url ?? null,
            isAvailable: product.isAvailable,
            category: product.category,
          },
        };
      });
  },

  async addFavorite(slug: string, input: { phone: string; productId: string }) {
    const establishment = await publicRepository.findEstablishmentBySlug(slug);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }

    const normalizedPhone = input.phone.replace(/\D/g, '');
    const product = await prisma.product.findFirst({
      where: { id: input.productId, establishmentId: establishment.id },
    });
    if (!product) {
      throw new AppError('Produto não encontrado.', 404);
    }

    const customer = await publicRepository.findCustomerByPhone(establishment.id, normalizedPhone);

    return publicRepository.addFavorite(
      establishment.id,
      normalizedPhone,
      input.productId,
      customer?.id ?? null,
    );
  },

  async removeFavorite(slug: string, phone: string, productId: string) {
    const establishment = await publicRepository.findEstablishmentBySlug(slug);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }

    const normalizedPhone = phone.replace(/\D/g, '');
    const result = await publicRepository.removeFavorite(establishment.id, normalizedPhone, productId);
    if (result.count === 0) {
      throw new AppError('Favorito não encontrado.', 404);
    }
  },

  async customerOrderHistory(slug: string, phone: string) {
    const establishment = await publicRepository.findEstablishmentBySlug(slug);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }

    const normalizedPhone = phone.replace(/\D/g, '');
    const orders = await publicRepository.findCustomerOrders(establishment.id, normalizedPhone);

    return orders.map((order) => ({
      id: order.id,
      code: order.code,
      status: order.status,
      type: order.type,
      total: Number(order.total),
      isScheduled: order.isScheduled,
      scheduledFor: order.scheduledFor,
      createdAt: order.createdAt,
      payment: order.payment
        ? {
            method: order.payment.method,
            status: order.payment.status,
            amount: Number(order.payment.amount),
          }
        : null,
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
        imageUrl: item.product?.imageUrl ?? null,
        additionals: item.additionals.map((a) => ({ name: a.name, price: Number(a.price) })),
      })),
    }));
  },

  async reorder(slug: string, input: { phone: string; orderId: string }) {
    const establishment = await publicRepository.findEstablishmentBySlug(slug);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }

    const normalizedPhone = input.phone.replace(/\D/g, '');
    const order = await publicRepository.findOrderForReorder(
      establishment.id,
      input.orderId,
      normalizedPhone,
    );
    if (!order) {
      throw new AppError('Pedido não encontrado.', 404);
    }

    const productIds = [...new Set(order.items.map((i) => i.productId).filter((id): id is string => Boolean(id)))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, establishmentId: establishment.id },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const available: Array<{
      productId: string;
      name: string;
      quantity: number;
      currentPrice: number;
      imageUrl: string | null;
      additionals: Array<{ name: string; additionalId: string | null }>;
    }> = [];
    const unavailable: Array<{ name: string; productId: string | null; reason: string }> = [];

    for (const item of order.items) {
      if (!item.productId) {
        unavailable.push({ name: item.name, productId: null, reason: 'Produto removido do cardápio.' });
        continue;
      }

      const product = productMap.get(item.productId);
      if (!product) {
        unavailable.push({ name: item.name, productId: item.productId, reason: 'Produto não existe mais.' });
        continue;
      }

      if (!product.isAvailable) {
        unavailable.push({
          name: item.name,
          productId: product.id,
          reason: 'Produto indisponível no momento.',
        });
        continue;
      }

      available.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        currentPrice: unitPrice(product),
        imageUrl: product.imageUrl ?? product.images[0]?.url ?? null,
        additionals: item.additionals.map((a) => ({ name: a.name, additionalId: a.additionalId })),
      });
    }

    return { orderId: order.id, code: order.code, available, unavailable };
  },
};
