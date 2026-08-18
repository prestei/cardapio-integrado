export type MenuSectionCopy = {
  kicker: string
  title: string
  description: string
}

export type MenuSectionsConfig = {
  favorites: MenuSectionCopy
  menu: MenuSectionCopy
  promotions: MenuSectionCopy
  nav: {
    loja: string
    favoritos: string
    cardapio: string
    promocoes: string
  }
}

export const DEFAULT_MENU_SECTIONS: MenuSectionsConfig = {
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
}

function asText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export function normalizeMenuSections(raw: unknown): MenuSectionsConfig {
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const favorites = (data.favorites ?? {}) as Record<string, unknown>
  const menu = (data.menu ?? {}) as Record<string, unknown>
  const promotions = (data.promotions ?? {}) as Record<string, unknown>
  const nav = (data.nav ?? {}) as Record<string, unknown>

  return {
    favorites: {
      kicker: asText(favorites.kicker, DEFAULT_MENU_SECTIONS.favorites.kicker),
      title: asText(favorites.title, DEFAULT_MENU_SECTIONS.favorites.title),
      description: asText(favorites.description, DEFAULT_MENU_SECTIONS.favorites.description),
    },
    menu: {
      kicker: asText(menu.kicker, DEFAULT_MENU_SECTIONS.menu.kicker),
      title: asText(menu.title, DEFAULT_MENU_SECTIONS.menu.title),
      description: asText(menu.description, DEFAULT_MENU_SECTIONS.menu.description),
    },
    promotions: {
      kicker: asText(promotions.kicker, DEFAULT_MENU_SECTIONS.promotions.kicker),
      title: asText(promotions.title, DEFAULT_MENU_SECTIONS.promotions.title),
      description: asText(promotions.description, DEFAULT_MENU_SECTIONS.promotions.description),
    },
    nav: {
      loja: asText(nav.loja, DEFAULT_MENU_SECTIONS.nav.loja),
      favoritos: asText(nav.favoritos, DEFAULT_MENU_SECTIONS.nav.favoritos),
      cardapio: asText(nav.cardapio, DEFAULT_MENU_SECTIONS.nav.cardapio),
      promocoes: asText(nav.promocoes, DEFAULT_MENU_SECTIONS.nav.promocoes),
    },
  }
}
