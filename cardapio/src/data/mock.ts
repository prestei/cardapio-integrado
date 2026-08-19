import type { MenuData, Product } from '@/types'

const IMG = {
  facade:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80&auto=format',
  salon:
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=80&auto=format',
  detail:
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80&auto=format',
  night:
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1920&q=80&auto=format',
  burgerBlack:
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80&auto=format',
  burgerArtisan:
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=80&auto=format',
  fries:
    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=1200&q=80&auto=format',
  ribs:
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80&auto=format',
  salad:
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80&auto=format',
  bruschetta:
    'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=1200&q=80&auto=format',
  pizza:
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80&auto=format',
  dessert:
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1200&q=80&auto=format',
  drink:
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80&auto=format',
  wings:
    'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=1200&q=80&auto=format',
  steak:
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1200&q=80&auto=format',
  pasta:
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=1200&q=80&auto=format',
  combo:
    'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=1200&q=80&auto=format',
  sundae:
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=1200&q=80&auto=format',
  mocktail:
    'https://images.unsplash.com/photo-1536935338788-846bb8044359?w=1200&q=80&auto=format',
}

const addonClassic = {
  id: 'ag-classic',
  name: 'Extras',
  min: 0,
  max: 5,
  required: false,
  addons: [
    { id: 'ad-cheese', name: 'Queijo extra', price: 6, isAvailable: true },
    { id: 'ad-bacon', name: 'Bacon crocante', price: 8, isAvailable: true },
    { id: 'ad-egg', name: 'Ovo caipira', price: 5, isAvailable: true },
    { id: 'ad-onion', name: 'Cebola caramelizada', price: 4, isAvailable: true },
  ],
}

const addonDoneness = {
  id: 'ag-point',
  name: 'Ponto da carne',
  min: 1,
  max: 1,
  required: true,
  addons: [
    { id: 'ad-mal', name: 'Mal passada', price: 0, isAvailable: true },
    { id: 'ad-ao', name: 'Ao ponto', price: 0, isAvailable: true },
    { id: 'ad-bem', name: 'Bem passada', price: 0, isAvailable: true },
  ],
}

function p(
  partial: Omit<Product, 'isAvailable' | 'hasAdditionals'> & {
    isAvailable?: boolean
    hasAdditionals?: boolean
    addonGroups?: Product['addonGroups']
  },
): Product {
  const groups = partial.addonGroups
  return {
    isAvailable: true,
    hasAdditionals: Boolean(groups?.length),
    ...partial,
    addonGroups: groups,
  }
}

export const mockMenu: MenuData = {
  store: {
    id: 'est-lume',
    name: 'LUME',
    slug: 'lume',
    tagline: 'Uma experiência para saborear',
    description:
      'Fogo lento, ingredientes de origem e uma casa pensada para a noite. LUME é gastronomia contemporânea com alma brasileira.',
    phone: '(11) 3456-7890',
    whatsapp: '5511999998877',
    address: 'Rua das Magnólias, 214 — Jardins, São Paulo',
    logoUrl: null,
    primaryColor: '#0C0B0A',
    secondaryColor: '#D4A574',
    accentColor: '#E8E2D9',
    isOpen: true,
    estimatedMinutes: 25,
    images: [
      {
        id: 'img-1',
        url: IMG.facade,
        alt: 'Fachada iluminada do restaurante LUME',
        label: 'Fachada',
      },
      {
        id: 'img-2',
        url: IMG.salon,
        alt: 'Salão principal com mesas e luz baixa',
        label: 'Salão',
      },
      {
        id: 'img-3',
        url: IMG.detail,
        alt: 'Detalhe de mesa posta com pratos',
        label: 'Detalhe',
      },
      {
        id: 'img-4',
        url: IMG.night,
        alt: 'Ambiente noturno do LUME',
        label: 'Experiência',
      },
    ],
  },
  featuredProducts: [],
  categories: [
    {
      id: 'cat-entradas',
      name: 'Entradas',
      description: 'Para abrir o apetite',
      imageUrl: null,
      sortOrder: 1,
      products: [
        p({
          id: 'prod-bruschetta',
          categoryId: 'cat-entradas',
          name: 'Bruschetta de Tomate',
          description:
            'Pão de fermentação lenta, tomate confit, manjericão fresco e azeite de oliva.',
          price: 32.9,
          promoPrice: null,
          imageUrl: IMG.bruschetta,
          isFeatured: false,
          prepTimeMinutes: 12,
          tags: ['vegetariano'],
        }),
        p({
          id: 'prod-wings',
          categoryId: 'cat-entradas',
          name: 'Asas Lacadas',
          description: 'Asas crocantes, glaze de mel e pimenta, cebolinha e limão.',
          price: 39.9,
          promoPrice: null,
          imageUrl: IMG.wings,
          isFeatured: true,
          prepTimeMinutes: 18,
          addonGroups: [addonClassic],
        }),
        p({
          id: 'prod-salad',
          categoryId: 'cat-entradas',
          name: 'Verde da Casa',
          description: 'Mix de folhas, abacate, castanhas e vinagrete cítrico.',
          price: 34.9,
          promoPrice: null,
          imageUrl: IMG.salad,
          isFeatured: false,
          prepTimeMinutes: 10,
          tags: ['leve'],
        }),
      ],
    },
    {
      id: 'cat-burgers',
      name: 'Hambúrgueres',
      description: 'Blends da casa, pães artesanais',
      imageUrl: null,
      sortOrder: 2,
      products: [
        p({
          id: 'prod-black',
          categoryId: 'cat-burgers',
          name: 'Burger Black',
          description:
            'Pão brioche escuro, blend 180g, queijo cheddar, bacon e molho defumado.',
          price: 49.9,
          promoPrice: null,
          imageUrl: IMG.burgerBlack,
          isFeatured: true,
          prepTimeMinutes: 22,
          tags: ['assinatura'],
          addonGroups: [addonDoneness, addonClassic],
        }),
        p({
          id: 'prod-artisan',
          categoryId: 'cat-burgers',
          name: 'Burger Artesanal',
          description:
            'Pão brioche, blend da casa, queijo, molho especial e cebola caramelizada.',
          price: 42.9,
          promoPrice: 38.9,
          imageUrl: IMG.burgerArtisan,
          isFeatured: true,
          prepTimeMinutes: 20,
          addonGroups: [addonDoneness, addonClassic],
        }),
        p({
          id: 'prod-lume-burger',
          categoryId: 'cat-burgers',
          name: 'Lume Smash',
          description: 'Dois smashes, queijo suíço, pickles e maionese de alho negro.',
          price: 46.9,
          promoPrice: null,
          imageUrl: IMG.combo,
          isFeatured: true,
          prepTimeMinutes: 18,
          addonGroups: [addonClassic],
        }),
      ],
    },
    {
      id: 'cat-principais',
      name: 'Principais',
      description: 'Pratos para a mesa',
      imageUrl: null,
      sortOrder: 3,
      products: [
        p({
          id: 'prod-ribs',
          categoryId: 'cat-principais',
          name: 'Costela Lacada',
          description: 'Costela slow-cooked 8h, glaze de demerara e farofa crocante.',
          price: 89.9,
          promoPrice: null,
          imageUrl: IMG.ribs,
          isFeatured: true,
          prepTimeMinutes: 25,
          tags: ['assinatura'],
          addonGroups: [addonDoneness],
        }),
        p({
          id: 'prod-steak',
          categoryId: 'cat-principais',
          name: 'Bife Ancho',
          description: 'Ancho 300g, manteiga de ervas e batata confitada.',
          price: 98.9,
          promoPrice: null,
          imageUrl: IMG.steak,
          isFeatured: false,
          prepTimeMinutes: 28,
          addonGroups: [addonDoneness],
        }),
        p({
          id: 'prod-pasta',
          categoryId: 'cat-principais',
          name: 'Fettuccine Funghi',
          description: 'Massa fresca, cogumelos salteados e creme de parmesão.',
          price: 54.9,
          promoPrice: null,
          imageUrl: IMG.pasta,
          isFeatured: false,
          prepTimeMinutes: 20,
        }),
      ],
    },
    {
      id: 'cat-pizzas',
      name: 'Pizzas',
      description: 'Massa fina, forno vivo',
      imageUrl: null,
      sortOrder: 4,
      products: [
        p({
          id: 'prod-pizza-marghe',
          categoryId: 'cat-pizzas',
          name: 'Margherita',
          description: 'Molho de tomate, mozzarella di bufala e manjericão.',
          price: 58.9,
          promoPrice: null,
          imageUrl: IMG.pizza,
          isFeatured: false,
          prepTimeMinutes: 18,
        }),
        p({
          id: 'prod-pizza-trufa',
          categoryId: 'cat-pizzas',
          name: 'Funghi & Trufa',
          description: 'Cogumelos, mozzarella e azeite trufado.',
          price: 72.9,
          promoPrice: null,
          imageUrl: IMG.pizza,
          isFeatured: true,
          prepTimeMinutes: 20,
        }),
      ],
    },
    {
      id: 'cat-porcoes',
      name: 'Porções',
      description: 'Para compartilhar',
      imageUrl: null,
      sortOrder: 5,
      products: [
        p({
          id: 'prod-fries',
          categoryId: 'cat-porcoes',
          name: 'Batata Lume',
          description: 'Batatas rústicas, parmesão e aioli de alho.',
          price: 28.9,
          promoPrice: null,
          imageUrl: IMG.fries,
          isFeatured: false,
          prepTimeMinutes: 15,
          addonGroups: [
            {
              id: 'ag-fries',
              name: 'Complementos',
              min: 0,
              max: 3,
              required: false,
              addons: [
                { id: 'ad-cheddar', name: 'Cheddar cremoso', price: 7, isAvailable: true },
                { id: 'ad-bacon-f', name: 'Bacon', price: 8, isAvailable: true },
              ],
            },
          ],
        }),
      ],
    },
    {
      id: 'cat-sobremesas',
      name: 'Sobremesas',
      description: 'O final doce',
      imageUrl: null,
      sortOrder: 6,
      products: [
        p({
          id: 'prod-dessert',
          categoryId: 'cat-sobremesas',
          name: 'Petit Gateau',
          description: 'Chocolate 70%, centro cremoso e sorvete de baunilha.',
          price: 36.9,
          promoPrice: null,
          imageUrl: IMG.dessert,
          isFeatured: true,
          prepTimeMinutes: 14,
        }),
        p({
          id: 'prod-sundae',
          categoryId: 'cat-sobremesas',
          name: 'Sundae Caramelo',
          description: 'Sorvete, caramelo salgado e farofa de amendoim.',
          price: 29.9,
          promoPrice: 24.9,
          imageUrl: IMG.sundae,
          isFeatured: false,
          prepTimeMinutes: 8,
        }),
      ],
    },
    {
      id: 'cat-bebidas',
      name: 'Bebidas',
      description: 'Drinks e refrescos',
      imageUrl: null,
      sortOrder: 7,
      products: [
        p({
          id: 'prod-drink',
          categoryId: 'cat-bebidas',
          name: 'Negroni da Casa',
          description: 'Gin, Campari, vermute e zest de laranja.',
          price: 38.9,
          promoPrice: null,
          imageUrl: IMG.drink,
          isFeatured: false,
          prepTimeMinutes: 5,
        }),
        p({
          id: 'prod-mocktail',
          categoryId: 'cat-bebidas',
          name: 'Lume Spritz Zero',
          description: 'Tônica artesanal, cítricos e bitter sem álcool.',
          price: 26.9,
          promoPrice: null,
          imageUrl: IMG.mocktail,
          isFeatured: false,
          prepTimeMinutes: 5,
          tags: ['sem álcool'],
        }),
      ],
    },
  ],
  promotions: [
    {
      id: 'promo-combo',
      title: 'Combo da Casa',
      subtitle: 'Burger + Batata + Bebida',
      description: 'Escolha um hambúrguer, porção de batata e refrigerante ou suco.',
      imageUrl: IMG.combo,
      originalPrice: 79.9,
      promoPrice: 59.9,
      discountPercent: 25,
      validUntil: '2026-08-31',
      productIds: ['prod-artisan', 'prod-fries'],
      ctaLabel: 'Aproveitar',
    },
    {
      id: 'promo-dessert',
      title: 'Doce da Noite',
      subtitle: 'Petit Gateau com 20% off',
      description: 'O clássico da casa com preço especial após as 21h.',
      imageUrl: IMG.dessert,
      originalPrice: 36.9,
      promoPrice: 29.5,
      discountPercent: 20,
      validUntil: '2026-08-17',
      productIds: ['prod-dessert'],
      ctaLabel: 'Quero agora',
    },
    {
      id: 'promo-wings',
      title: 'Asas em Dobro',
      subtitle: 'Entrada em destaque',
      description: 'Asas lacadas com preço de happy hour o dia todo.',
      imageUrl: IMG.wings,
      originalPrice: 39.9,
      promoPrice: 29.9,
      discountPercent: 25,
      validUntil: '2026-08-20',
      productIds: ['prod-wings'],
      ctaLabel: 'Pedir asas',
    },
  ],
  sections: {
    favorites: {
      kicker: 'Seleção',
      title: 'Favoritos da casa',
      description:
        'Os pratos que definem a casa — escolhidos para despertar desejo antes da escolha.',
    },
    menu: {
      kicker: 'Cardápio',
      title: 'Nosso cardápio',
      description:
        'Navegue pelas categorias. Cada prato foi pensado para ser escolhido com calma — ou com fome.',
    },
    promotions: {
      kicker: 'Promoções',
      title: 'Hoje tem mais',
      description: 'Peças especiais do dia — para quem quer mais sabor por menos.',
    },
    nav: {
      loja: 'Loja',
      favoritos: 'Favoritos',
      cardapio: 'Cardápio',
      promocoes: 'Ofertas',
    },
  },
}

mockMenu.featuredProducts = mockMenu.categories
  .flatMap((c) => c.products)
  .filter((p) => p.isFeatured)
