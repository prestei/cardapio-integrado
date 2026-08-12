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
      description: 'Os melhores hambúrgueres artesanais da região.',
      phone: '(11) 3456-7890',
      whatsapp: '5511987654321',
      email: 'contato@burgerhouse.demo',
      address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
      cnpj: '12.345.678/0001-90',
      primaryColor: '#E8A54B',
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
      data: { establishmentId: establishment.id, name: 'Bebidas', description: 'Refrigerantes, sucos e cervejas', sortOrder: 1 },
    }),
    prisma.category.create({
      data: { establishmentId: establishment.id, name: 'Sobremesas', description: 'Para fechar com chave de ouro', sortOrder: 2 },
    }),
    prisma.category.create({
      data: { establishmentId: establishment.id, name: 'Porções', description: 'Acompanhamentos e petiscos', sortOrder: 3 },
    }),
  ]);

  const [catBurgers, catDrinks, catDesserts, catSides] = categories;

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
          { name: 'Individual', price: 0, sortOrder: 0 },
          { name: 'Duplo', price: 8, sortOrder: 1 },
          { name: 'Triplo', price: 14, sortOrder: 2 },
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
          { name: 'Queijo cheddar', price: 4, sortOrder: 1 },
          { name: 'Ovo', price: 3, sortOrder: 2 },
          { name: 'Cebola caramelizada', price: 3.5, sortOrder: 3 },
          { name: 'Molho especial', price: 2, sortOrder: 4 },
        ],
      },
    },
    include: { additionals: true },
  });

  const productDefs = [
    // Hambúrgueres
    { categoryId: catBurgers!.id, name: 'Classic Burger', description: 'Pão brioche, carne 180g, alface, tomate e molho da casa.', price: 32.9, promoPrice: 29.9, prepTimeMinutes: 20, isFeatured: true, sortOrder: 0 },
    { categoryId: catBurgers!.id, name: 'Cheese Bacon', description: 'Carne 180g, bacon crocante e queijo cheddar derretido.', price: 38.9, prepTimeMinutes: 22, isFeatured: true, sortOrder: 1 },
    { categoryId: catBurgers!.id, name: 'Smash Burger', description: 'Dupla carne smash, queijo americano e picles.', price: 36.5, prepTimeMinutes: 18, isFeatured: true, sortOrder: 2 },
    { categoryId: catBurgers!.id, name: 'Veggie Burger', description: 'Hambúrguer de grão-de-bico com abacate e rúcula.', price: 34.9, prepTimeMinutes: 20, sortOrder: 3 },
    { categoryId: catBurgers!.id, name: 'X-Bacon Especial', description: 'Blend artesanal, cheddar, bacon crocante e molho secreto.', price: 39.9, promoPrice: 34.9, prepTimeMinutes: 22, isFeatured: true, sortOrder: 4 },
    { categoryId: catBurgers!.id, name: 'X-Salada Burger', description: 'Carne 160g, alface, tomate, cebola roxa e maionese.', price: 28.9, prepTimeMinutes: 18, sortOrder: 5 },
    { categoryId: catBurgers!.id, name: 'Hambúrguer Artesanal', description: 'Blend 180g, queijo prato, picles e barbecue.', price: 34.9, prepTimeMinutes: 22, isFeatured: true, sortOrder: 6 },
    { categoryId: catBurgers!.id, name: 'Double Cheese Burger', description: 'Duas carnes, dobro de cheddar e molho especial.', price: 42.9, prepTimeMinutes: 24, sortOrder: 7 },
    { categoryId: catBurgers!.id, name: 'Burger BBQ', description: 'Carne grelhada, cebola caramelizada e molho barbecue.', price: 37.9, promoPrice: 33.9, prepTimeMinutes: 21, sortOrder: 8 },
    { categoryId: catBurgers!.id, name: 'Chicken Burger', description: 'Filé de frango empanado, alface e molho ranch.', price: 31.9, prepTimeMinutes: 20, sortOrder: 9 },
    { categoryId: catBurgers!.id, name: 'Burger Pepper Jack', description: 'Carne 180g, queijo pepper jack e jalapeño.', price: 38.5, prepTimeMinutes: 22, sortOrder: 10 },
    { categoryId: catBurgers!.id, name: 'Mushroom Burger', description: 'Carne artesanal, cogumelos salteados e queijo suíço.', price: 39.5, prepTimeMinutes: 23, sortOrder: 11 },
    { categoryId: catBurgers!.id, name: 'Burger da Casa', description: 'Blend secreto, bacon, ovo e molho da casa.', price: 41.9, promoPrice: 36.9, prepTimeMinutes: 25, isFeatured: true, sortOrder: 12 },
    { categoryId: catBurgers!.id, name: 'Mini Burger Kids', description: 'Porção infantil com batata e suco.', price: 24.9, prepTimeMinutes: 15, sortOrder: 13 },
    { categoryId: catBurgers!.id, name: 'Vegano Smash', description: 'Smash de proteína vegetal, tomate e molho vegano.', price: 35.9, prepTimeMinutes: 20, sortOrder: 14 },

    // Bebidas
    { categoryId: catDrinks!.id, name: 'Coca-Cola 350ml', description: 'Lata gelada.', price: 8, prepTimeMinutes: 2, sortOrder: 0 },
    { categoryId: catDrinks!.id, name: 'Coca-Cola Zero 350ml', description: 'Lata zero açúcar.', price: 8, prepTimeMinutes: 2, sortOrder: 1 },
    { categoryId: catDrinks!.id, name: 'Guaraná Antarctica 350ml', description: 'Lata bem gelada.', price: 7.5, prepTimeMinutes: 2, sortOrder: 2 },
    { categoryId: catDrinks!.id, name: 'Refrigerante 600ml', description: 'Garrafa pet — sabores variados.', price: 11, prepTimeMinutes: 2, sortOrder: 3 },
    { categoryId: catDrinks!.id, name: 'Suco de Laranja', description: 'Natural 400ml.', price: 12, prepTimeMinutes: 5, sortOrder: 4 },
    { categoryId: catDrinks!.id, name: 'Suco de Maracujá', description: 'Natural 400ml.', price: 12, prepTimeMinutes: 5, sortOrder: 5 },
    { categoryId: catDrinks!.id, name: 'Suco de Abacaxi com Hortelã', description: 'Natural 400ml.', price: 13, prepTimeMinutes: 5, sortOrder: 6 },
    { categoryId: catDrinks!.id, name: 'Água Mineral 500ml', description: 'Com ou sem gás.', price: 5, prepTimeMinutes: 1, sortOrder: 7 },
    { categoryId: catDrinks!.id, name: 'Água com Gás 500ml', description: 'Gelada.', price: 5.5, prepTimeMinutes: 1, sortOrder: 8 },
    { categoryId: catDrinks!.id, name: 'Cerveja Artesanal IPA', description: 'IPA 473ml bem gelada.', price: 18, prepTimeMinutes: 2, sortOrder: 9 },
    { categoryId: catDrinks!.id, name: 'Cerveja Long Neck', description: '355ml — marcas variadas.', price: 12, prepTimeMinutes: 2, sortOrder: 10 },
    { categoryId: catDrinks!.id, name: 'Chá Gelado Limão', description: 'Copo 400ml.', price: 9, prepTimeMinutes: 3, sortOrder: 11 },
    { categoryId: catDrinks!.id, name: 'Energético Lata', description: '250ml gelado.', price: 14, prepTimeMinutes: 1, sortOrder: 12 },

    // Sobremesas
    { categoryId: catDesserts!.id, name: 'Brownie com Sorvete', description: 'Brownie quente com bola de sorvete de creme.', price: 22, promoPrice: 19.9, prepTimeMinutes: 8, isFeatured: true, sortOrder: 0 },
    { categoryId: catDesserts!.id, name: 'Milk Shake Chocolate', description: 'Cremoso 400ml.', price: 16, prepTimeMinutes: 6, sortOrder: 1 },
    { categoryId: catDesserts!.id, name: 'Milk Shake Morango', description: 'Cremoso 400ml.', price: 16, prepTimeMinutes: 6, sortOrder: 2 },
    { categoryId: catDesserts!.id, name: 'Milk Shake Baunilha', description: 'Cremoso 400ml.', price: 15.5, prepTimeMinutes: 6, sortOrder: 3 },
    { categoryId: catDesserts!.id, name: 'Petit Gateau', description: 'Bolinho de chocolate com sorvete.', price: 24.9, promoPrice: 21.9, prepTimeMinutes: 12, isFeatured: true, sortOrder: 4 },
    { categoryId: catDesserts!.id, name: 'Sundae de Chocolate', description: 'Sorvete, calda e granulado.', price: 14.9, prepTimeMinutes: 5, sortOrder: 5 },
    { categoryId: catDesserts!.id, name: 'Cookie Recheado', description: 'Cookie quente com recheio de Nutella.', price: 12.9, prepTimeMinutes: 8, sortOrder: 6 },
    { categoryId: catDesserts!.id, name: 'Cheesecake de Frutas Vermelhas', description: 'Fatia generosa com calda.', price: 19.9, prepTimeMinutes: 4, sortOrder: 7 },
    { categoryId: catDesserts!.id, name: 'Açaí Bowl 400ml', description: 'Açaí com granola e banana.', price: 18.9, prepTimeMinutes: 7, sortOrder: 8 },

    // Porções
    { categoryId: catSides!.id, name: 'Batata Frita', description: 'Porção individual crocante.', price: 18, prepTimeMinutes: 10, isFeatured: true, sortOrder: 0 },
    { categoryId: catSides!.id, name: 'Batata com Cheddar e Bacon', description: 'Batata coberta com cheddar e bacon.', price: 28, prepTimeMinutes: 12, isFeatured: true, sortOrder: 1 },
    { categoryId: catSides!.id, name: 'Batata Rústica', description: 'Com alecrim e sal grosso.', price: 22, prepTimeMinutes: 14, sortOrder: 2 },
    { categoryId: catSides!.id, name: 'Onion Rings', description: 'Anéis de cebola empanados.', price: 20, prepTimeMinutes: 12, sortOrder: 3 },
    { categoryId: catSides!.id, name: 'Nuggets (6un)', description: 'Frango empanado com molho.', price: 22, prepTimeMinutes: 12, sortOrder: 4 },
    { categoryId: catSides!.id, name: 'Nuggets (10un)', description: 'Frango empanado com molhos.', price: 28, prepTimeMinutes: 14, sortOrder: 5 },
    { categoryId: catSides!.id, name: 'Anéis de Lula', description: 'Empanados com limão e molho tártaro.', price: 34.9, prepTimeMinutes: 16, sortOrder: 6 },
    { categoryId: catSides!.id, name: 'Bolinho de Costela', description: '6 unidades crocantes.', price: 29.9, prepTimeMinutes: 15, sortOrder: 7 },
    { categoryId: catSides!.id, name: 'Mandioca Frita', description: 'Porção crocante com sal.', price: 19.9, prepTimeMinutes: 12, sortOrder: 8 },
    { categoryId: catSides!.id, name: 'Isca de Frango', description: 'Empanada com molho barbecue.', price: 26.9, prepTimeMinutes: 14, sortOrder: 9 },
    { categoryId: catSides!.id, name: 'Mix de Petiscos', description: 'Batata, onion rings e nuggets para compartilhar.', price: 45.9, promoPrice: 39.9, prepTimeMinutes: 18, isFeatured: true, sortOrder: 10 },
    { categoryId: catSides!.id, name: 'Salada Caesar', description: 'Alface, croutons, parmesão e molho caesar.', price: 24.9, prepTimeMinutes: 8, sortOrder: 11 },
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
        additionalGroups: def.categoryId === catBurgers!.id
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

  await prisma.businessHours.createMany({
    data: [
      { establishmentId: establishment.id, dayOfWeek: 0, isClosed: true },
      { establishmentId: establishment.id, dayOfWeek: 1, openTime: '18:00', closeTime: '23:00', isClosed: false },
      { establishmentId: establishment.id, dayOfWeek: 2, openTime: '18:00', closeTime: '23:00', isClosed: false },
      { establishmentId: establishment.id, dayOfWeek: 3, openTime: '18:00', closeTime: '23:30', isClosed: false },
      { establishmentId: establishment.id, dayOfWeek: 4, openTime: '18:00', closeTime: '00:00', isClosed: false },
      { establishmentId: establishment.id, dayOfWeek: 5, openTime: '18:00', closeTime: '01:00', isClosed: false },
      { establishmentId: establishment.id, dayOfWeek: 6, openTime: '12:00', closeTime: '01:00', isClosed: false },
    ],
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
