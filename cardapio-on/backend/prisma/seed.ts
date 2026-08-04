import {
  CouponType,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  SelectionType,
  UserRole,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD = 'demo1234';

function daysAgo(days: number, hour = 12, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('🌱 Iniciando seed...');

  await prisma.couponUsage.deleteMany();
  await prisma.orderItemAdditional.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.businessHours.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.productAdditionalGroup.deleteMany();
  await prisma.additional.deleteMany();
  await prisma.additionalGroup.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.establishment.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const establishment = await prisma.establishment.create({
    data: {
      name: 'Burger House Demo',
      slug: 'burger-house',
      description: 'Hambúrgueres artesanais, porções e combos feitos na hora.',
      phone: '(11) 3456-7890',
      whatsapp: '5511987654321',
      email: 'contato@burgerhouse.demo',
      address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
      cnpj: '12.345.678/0001-90',
      primaryColor: '#F2A94A',
      secondaryColor: '#1C1C1C',
      plan: 'Pro',
      isOpen: true,
    },
  });

  const users = await Promise.all([
    prisma.user.create({
      data: {
        establishmentId: establishment.id,
        name: 'Carlos Dono',
        email: 'dono@demo.com',
        passwordHash,
        role: UserRole.OWNER,
        phone: '(11) 99999-0001',
      },
    }),
    prisma.user.create({
      data: {
        establishmentId: establishment.id,
        name: 'Ana Admin',
        email: 'admin@demo.com',
        passwordHash,
        role: UserRole.ADMIN,
        phone: '(11) 99999-0002',
      },
    }),
    prisma.user.create({
      data: {
        establishmentId: establishment.id,
        name: 'Bruno Gerente',
        email: 'gerente@demo.com',
        passwordHash,
        role: UserRole.MANAGER,
        phone: '(11) 99999-0003',
      },
    }),
  ]);

  const categories = await Promise.all([
    prisma.category.create({
      data: { establishmentId: establishment.id, name: 'Hambúrgueres', description: 'Artesanais e suculentos', sortOrder: 0 },
    }),
    prisma.category.create({
      data: { establishmentId: establishment.id, name: 'Porções', description: 'Acompanhamentos generosos', sortOrder: 1 },
    }),
    prisma.category.create({
      data: { establishmentId: establishment.id, name: 'Petiscos', description: 'Para compartilhar', sortOrder: 2 },
    }),
    prisma.category.create({
      data: { establishmentId: establishment.id, name: 'Bebidas', description: 'Refrigerantes, sucos e cervejas', sortOrder: 3 },
    }),
    prisma.category.create({
      data: { establishmentId: establishment.id, name: 'Sobremesas', description: 'Para fechar com chave de ouro', sortOrder: 4 },
    }),
    prisma.category.create({
      data: { establishmentId: establishment.id, name: 'Combos', description: 'Mais sabor por menos', sortOrder: 5 },
    }),
  ]);

  const [catBurgers, catSides, catSnacks, catDrinks, catDesserts, catCombos] = categories;

  const sizeGroup = await prisma.additionalGroup.create({
    data: {
      establishmentId: establishment.id,
      name: 'Tamanho',
      selectionType: SelectionType.SINGLE,
      isRequired: true,
      minQuantity: 1,
      maxQuantity: 1,
      sortOrder: 0,
      additionals: {
        create: [
          { name: 'Pequeno', price: 0, sortOrder: 0 },
          { name: 'Médio', price: 5, sortOrder: 1 },
          { name: 'Grande', price: 10, sortOrder: 2 },
        ],
      },
    },
    include: { additionals: true },
  });

  const extrasGroup = await prisma.additionalGroup.create({
    data: {
      establishmentId: establishment.id,
      name: 'Adicionais',
      selectionType: SelectionType.MULTIPLE,
      isRequired: false,
      minQuantity: 0,
      maxQuantity: 5,
      sortOrder: 1,
      additionals: {
        create: [
          { name: 'Bacon', price: 5, sortOrder: 0 },
          { name: 'Cheddar extra', price: 4, sortOrder: 1 },
          { name: 'Ovo', price: 3, sortOrder: 2 },
          { name: 'Molho especial', price: 2, sortOrder: 3 },
        ],
      },
    },
    include: { additionals: true },
  });

  const productDefs = [
    { categoryId: catBurgers!.id, name: 'X-Bacon Especial', description: 'Hambúrguer artesanal, queijo cheddar, bacon crocante, molho da casa e pão brioche.', price: 32.9, promoPrice: 29.9, prepTimeMinutes: 20, isFeatured: true, sortOrder: 0, withOptions: true },
    { categoryId: catBurgers!.id, name: 'X-Salada', description: 'Carne 160g, alface, tomate, cebola roxa e maionese da casa.', price: 26.9, prepTimeMinutes: 18, isFeatured: true, sortOrder: 1, withOptions: true },
    { categoryId: catBurgers!.id, name: 'Hambúrguer Artesanal', description: 'Blend especial 180g, queijo prato, picles e molho barbecue.', price: 34.9, prepTimeMinutes: 22, isFeatured: true, sortOrder: 2, withOptions: true },
    { categoryId: catSides!.id, name: 'Batata Frita', description: 'Porção crocante com sal e ervas.', price: 18, prepTimeMinutes: 10, sortOrder: 0 },
    { categoryId: catSides!.id, name: 'Batata com Cheddar e Bacon', description: 'Batata frita coberta com cheddar cremoso e bacon.', price: 28, prepTimeMinutes: 12, isFeatured: true, sortOrder: 1 },
    { categoryId: catSnacks!.id, name: 'Calabresa Acebolada', description: 'Calabresa fatiada com cebola e pimenta a gosto.', price: 32, prepTimeMinutes: 15, sortOrder: 0 },
    { categoryId: catDrinks!.id, name: 'Refrigerante Lata', description: '350ml gelado — sabores variados.', price: 8, prepTimeMinutes: 2, sortOrder: 0 },
    { categoryId: catDrinks!.id, name: 'Cerveja', description: 'Long neck 355ml bem gelada.', price: 12, prepTimeMinutes: 2, sortOrder: 1 },
    { categoryId: catDesserts!.id, name: 'Milkshake', description: 'Chocolate, morango ou baunilha — 400ml.', price: 16, prepTimeMinutes: 6, sortOrder: 0 },
    { categoryId: catCombos!.id, name: 'Combo da Casa', description: 'X-Bacon Especial + Batata Frita + Refrigerante Lata.', price: 49.9, promoPrice: 44.9, prepTimeMinutes: 25, isFeatured: true, sortOrder: 0 },
  ];

  const products = [];
  for (const def of productDefs) {
    const product = await prisma.product.create({
      data: {
        establishmentId: establishment.id,
        categoryId: def.categoryId,
        name: def.name,
        description: def.description,
        price: def.price,
        promoPrice: def.promoPrice ?? null,
        prepTimeMinutes: def.prepTimeMinutes,
        isFeatured: def.isFeatured ?? false,
        sortOrder: def.sortOrder,
        isAvailable: true,
        additionalGroups: def.withOptions
          ? {
              create: [
                { additionalGroupId: sizeGroup.id },
                { additionalGroupId: extrasGroup.id },
              ],
            }
          : undefined,
      },
    });
    products.push(product);
  }

  const customerDefs = [
    { name: 'João Silva', phone: '11987654321', email: 'joao@email.com', street: 'Rua Augusta', number: '500', neighborhood: 'Consolação', city: 'São Paulo', state: 'SP', zipCode: '01304-000' },
    { name: 'Maria Santos', phone: '11976543210', email: 'maria@email.com', street: 'Rua Oscar Freire', number: '120', neighborhood: 'Jardins', city: 'São Paulo', state: 'SP', zipCode: '01426-001' },
    { name: 'Pedro Oliveira', phone: '11965432109', email: 'pedro@email.com', street: 'Av. Faria Lima', number: '2500', neighborhood: 'Pinheiros', city: 'São Paulo', state: 'SP', zipCode: '05426-100' },
    { name: 'Ana Costa', phone: '11954321098', email: 'ana@email.com', street: 'Rua da Consolação', number: '900', neighborhood: 'Consolação', city: 'São Paulo', state: 'SP', zipCode: '01302-000' },
    { name: 'Lucas Ferreira', phone: '11943210987', email: 'lucas@email.com', street: 'Rua Haddock Lobo', number: '300', neighborhood: 'Cerqueira César', city: 'São Paulo', state: 'SP', zipCode: '01414-001' },
    { name: 'Juliana Alves', phone: '11932109876', email: 'juliana@email.com', street: 'Rua Bela Cintra', number: '800', neighborhood: 'Consolação', city: 'São Paulo', state: 'SP', zipCode: '01415-002' },
    { name: 'Rafael Mendes', phone: '11921098765', email: 'rafael@email.com', street: 'Av. Rebouças', number: '1500', neighborhood: 'Pinheiros', city: 'São Paulo', state: 'SP', zipCode: '05401-100' },
    { name: 'Camila Rocha', phone: '11910987654', email: 'camila@email.com', street: 'Rua Teodoro Sampaio', number: '700', neighborhood: 'Pinheiros', city: 'São Paulo', state: 'SP', zipCode: '05406-050' },
  ];

  const customers = [];
  for (const c of customerDefs) {
    const customer = await prisma.customer.create({
      data: {
        establishmentId: establishment.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        addresses: {
          create: {
            label: 'Casa',
            street: c.street,
            number: c.number,
            neighborhood: c.neighborhood,
            city: c.city,
            state: c.state,
            zipCode: c.zipCode,
            isDefault: true,
          },
        },
      },
      include: { addresses: true },
    });
    customers.push(customer);
  }

  const deliveryZones = await Promise.all([
    prisma.deliveryZone.create({
      data: { establishmentId: establishment.id, name: 'Centro', fee: 5, estimatedMinutes: 30, isActive: true },
    }),
    prisma.deliveryZone.create({
      data: { establishmentId: establishment.id, name: 'Zona Norte', fee: 8, estimatedMinutes: 45, isActive: true },
    }),
    prisma.deliveryZone.create({
      data: { establishmentId: establishment.id, name: 'Zona Sul', fee: 10, estimatedMinutes: 50, isActive: true },
    }),
  ]);

  const coupons = await Promise.all([
    prisma.coupon.create({
      data: {
        establishmentId: establishment.id,
        code: 'BEMVINDO10',
        description: '10% de desconto na primeira compra',
        type: CouponType.PERCENTAGE,
        value: 10,
        minOrderValue: 40,
        usageLimit: 100,
        isActive: true,
      },
    }),
    prisma.coupon.create({
      data: {
        establishmentId: establishment.id,
        code: 'FRETE5',
        description: 'R$ 5 de desconto',
        type: CouponType.FIXED,
        value: 5,
        minOrderValue: 50,
        isActive: true,
      },
    }),
  ]);

  // Demo: aberto todos os dias (00:00–23:59) para facilitar testes a qualquer hora
  await prisma.businessHours.createMany({
    data: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      establishmentId: establishment.id,
      dayOfWeek,
      openTime: '00:00',
      closeTime: '23:59',
      isClosed: false,
    })),
  });

  await prisma.settings.create({
    data: {
      establishmentId: establishment.id,
      deliveryFeeType: 'ZONE',
      fixedDeliveryFee: 7,
      minOrderValue: 25,
      freeDeliveryAbove: 80,
      deliveryRadiusKm: 8,
      estimatedMinutes: 40,
      acceptCash: true,
      acceptPix: true,
      acceptCard: true,
      acceptOnline: false,
      publicMenuSlug: 'burger-house',
      themeMode: 'dark',
    },
  });

  await prisma.notification.createMany({
    data: [
      { establishmentId: establishment.id, title: 'Novo pedido', message: 'Pedido #1042 aguardando confirmação.', type: 'order', isRead: false },
      { establishmentId: establishment.id, title: 'Estoque baixo', message: 'Cerveja Artesanal com estoque abaixo do mínimo.', type: 'warning', isRead: false },
      { establishmentId: establishment.id, title: 'Avaliação recebida', message: 'Cliente João Silva deixou 5 estrelas.', type: 'info', isRead: true },
      { establishmentId: establishment.id, title: 'Cupom expirando', message: 'O cupom BEMVINDO10 expira em 7 dias.', type: 'info', isRead: true },
    ],
  });

  const statuses: OrderStatus[] = [
    OrderStatus.NEW,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
  ];

  const orderTypes: OrderType[] = [OrderType.DELIVERY, OrderType.PICKUP, OrderType.DINE_IN];
  const paymentMethods: PaymentMethod[] = [PaymentMethod.PIX, PaymentMethod.CARD, PaymentMethod.CASH, PaymentMethod.ONLINE];

  let orderCounter = 1000;

  const activePipeline: OrderStatus[] = [
    OrderStatus.NEW,
    OrderStatus.NEW,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.NEW,
  ];

  for (let i = 0; i < 25; i++) {
    const isActiveDemo = i < activePipeline.length;
    const daysBack = isActiveDemo ? 0 : randomInt(1, 29);
    const createdAt = daysAgo(daysBack, randomInt(11, 22), randomInt(0, 59));
    const customer = randomItem(customers);
    const address = customer.addresses[0]!;
    const type = randomItem(orderTypes);
    const status = isActiveDemo
      ? activePipeline[i]!
      : randomItem([OrderStatus.COMPLETED, OrderStatus.COMPLETED, OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.COMPLETED]);

    const burgerProducts = products.filter((p) => p.categoryId === catBurgers!.id);
    const drinkProducts = products.filter((p) => p.categoryId === catDrinks!.id);
    const sideProducts = products.filter((p) => p.categoryId === catSides!.id);

    const selectedProducts = [
      randomItem(burgerProducts),
      randomItem(Math.random() > 0.4 ? drinkProducts : sideProducts),
    ];

    if (Math.random() > 0.6) {
      selectedProducts.push(randomItem(sideProducts));
    }

    let subtotal = 0;
    const itemsData = selectedProducts.map((product) => {
      const qty = randomInt(1, 2);
      const unitPrice = Number(product.promoPrice ?? product.price);
      const total = unitPrice * qty;
      subtotal += total;
      return { product, qty, unitPrice, total };
    });

    const deliveryFee = type === OrderType.DELIVERY ? Number(randomItem(deliveryZones).fee) : 0;
    const useCoupon = Math.random() > 0.8;
    const coupon = useCoupon ? randomItem(coupons) : null;
    let discount = 0;
    if (coupon) {
      discount = coupon.type === CouponType.PERCENTAGE
        ? subtotal * (Number(coupon.value) / 100)
        : Number(coupon.value);
    }
    const total = Math.max(subtotal + deliveryFee - discount, 0);

    orderCounter += 1;
    const code = `#${orderCounter}`;

    const statusHistory = [
      { status: OrderStatus.NEW, changedAt: createdAt.toISOString() },
    ];
    if (status !== OrderStatus.NEW) {
      statusHistory.push({
        status: OrderStatus.CONFIRMED,
        changedAt: new Date(createdAt.getTime() + 5 * 60 * 1000).toISOString(),
      });
    }
    if ([OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.COMPLETED].includes(status)) {
      statusHistory.push({
        status: OrderStatus.PREPARING,
        changedAt: new Date(createdAt.getTime() + 10 * 60 * 1000).toISOString(),
      });
    }
    if ([OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.COMPLETED].includes(status)) {
      statusHistory.push({
        status: OrderStatus.READY,
        changedAt: new Date(createdAt.getTime() + 25 * 60 * 1000).toISOString(),
      });
    }
    if ([OrderStatus.OUT_FOR_DELIVERY, OrderStatus.COMPLETED].includes(status)) {
      statusHistory.push({
        status: OrderStatus.OUT_FOR_DELIVERY,
        changedAt: new Date(createdAt.getTime() + 30 * 60 * 1000).toISOString(),
      });
    }
    if (status === OrderStatus.COMPLETED) {
      statusHistory.push({
        status: OrderStatus.COMPLETED,
        changedAt: new Date(createdAt.getTime() + 50 * 60 * 1000).toISOString(),
      });
    }
    if (status === OrderStatus.CANCELLED) {
      statusHistory.push({
        status: OrderStatus.CANCELLED,
        changedAt: new Date(createdAt.getTime() + 8 * 60 * 1000).toISOString(),
      });
    }

    const order = await prisma.order.create({
      data: {
        establishmentId: establishment.id,
        customerId: customer.id,
        addressId: type === OrderType.DELIVERY ? address.id : null,
        code,
        type,
        status,
        subtotal,
        deliveryFee,
        discount,
        total,
        couponId: coupon?.id ?? null,
        statusHistory,
        createdAt,
        updatedAt: createdAt,
        items: {
          create: itemsData.map(({ product, qty, unitPrice, total: itemTotal }) => ({
            productId: product.id,
            name: product.name,
            quantity: qty,
            unitPrice,
            total: itemTotal,
            additionals: product.categoryId === catBurgers!.id && Math.random() > 0.5
              ? {
                  create: [
                    {
                      additionalId: randomItem(sizeGroup.additionals).id,
                      name: randomItem(sizeGroup.additionals).name,
                      price: Number(randomItem(sizeGroup.additionals).price),
                    },
                  ],
                }
              : undefined,
          })),
        },
        payment: status !== OrderStatus.CANCELLED
          ? {
              create: {
                method: randomItem(paymentMethods),
                status: status === OrderStatus.COMPLETED ? PaymentStatus.PAID : PaymentStatus.PENDING,
                amount: total,
                paidAt: status === OrderStatus.COMPLETED ? new Date(createdAt.getTime() + 55 * 60 * 1000) : null,
              },
            }
          : undefined,
      },
    });

    if (coupon) {
      await prisma.couponUsage.create({
        data: {
          couponId: coupon.id,
          orderId: order.id,
          customerId: customer.id,
        },
      });
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { usageCount: { increment: 1 } },
      });
    }
  }

  console.log('✅ Seed concluído!');
  console.log('');
  console.log('Estabelecimento:', establishment.name, `(${establishment.slug})`);
  console.log('Usuários (senha: demo1234):');
  for (const u of users) {
    console.log(`  - ${u.email} (${u.role})`);
  }
  console.log(`Categorias: ${categories.length}`);
  console.log(`Produtos: ${products.length}`);
  console.log(`Clientes: ${customers.length}`);
  console.log('Pedidos: 25');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
