export const site = {
  name: "Come On",
  product: "Cardápio Digital",
  tagline: "O impresso ficou para trás.",
};

export const nav = [
  { href: "#beneficios", label: "Benefícios" },
  { href: "#comparativo", label: "Comparativo" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "FAQ" },
] as const;

export const floatingBadges = [
  { id: "instant", label: "Atualização Instantânea", icon: "bolt" },
  { id: "noapp", label: "Sem necessidade de App", icon: "phone" },
  { id: "orders", label: "+35% de Pedidos", icon: "rocket" },
  { id: "qr", label: "QR na mesa, pedido na hora", icon: "qr" },
] as const;

export const benefits = [
  {
    index: "01",
    title: "Rapidez impressionante",
    body: "O cliente aponta a câmera, abre o cardápio e escolhe. Sem app, sem fila de download, sem travar o aparelho no meio do jantar.",
    metric: "< 1s",
    metricLabel: "abertura média via QR",
  },
  {
    index: "02",
    title: "Alteração em tempo real",
    body: "Mude preços, publique o prato do dia ou esgote um item em segundos. A mesa seguinte já vê o cardápio certo — sem reimprimir nada.",
    metric: "Ao vivo",
    metricLabel: "painel sincronizado",
  },
  {
    index: "03",
    title: "Economia recorrente",
    body: "Elimine 100% dos custos com gráfica, plastificação e cardápios rasgados. O que era despesa mensal vira uma linha a menos no caixa.",
    metric: "0",
    metricLabel: "reimpressões por mês",
  },
] as const;

export const comparison = {
  before: {
    kicker: "Operação antiga",
    title: "Cardápio de papel",
    points: [
      "Envelhece rápido — manchas, dobras, páginas faltando",
      "Custo recorrente a cada ajuste de preço ou sazonal",
      "Rasga, suja e some no serviço do sábado",
      "Alteração na hora? Impossível. A cozinha muda, o papel não",
    ],
  },
  after: {
    kicker: "Operação Come On",
    title: "Cardápio digital",
    points: [
      "Visual limpo, alinhado à identidade da casa",
      "Atualizável em tempo real, item a item",
      "Fotos em alta definição que vendem o prato antes do garçom",
      "Experiência interativa: categorias, busca e pedido na mesa",
    ],
  },
} as const;

export const steps = [
  {
    num: "01",
    title: "Cadastre seus produtos",
    body: "Fotos, descrições, preços e categorias entram no painel. Você monta o cardápio do jeito que a casa já pensa o serviço — sem curva de aprendizado.",
    detail: "Painel intuitivo · fotos HD · categorias livres",
  },
  {
    num: "02",
    title: "Imprima o QR Code",
    body: "Gere placas em alta resolução e posicione nas mesas, no balcão ou nos displays. Um código. Qualquer celular. Sem app para o cliente.",
    detail: "PNG, SVG e PDF · pronto para gráfica ou plotter",
  },
  {
    num: "03",
    title: "Receba pedidos e acessos",
    body: "O cliente escaneia, navega o cardápio na mesa e, se você quiser, dispara o pedido direto no WhatsApp da casa. Você opera. O papel, não.",
    detail: "Acesso na mesa · WhatsApp opcional · zero taxa por pedido",
  },
] as const;

export const plans = [
  {
    id: "essencial",
    name: "Essencial",
    price: "29",
    period: "/mês",
    blurb: "Para quem quer sair do papel com o essencial bem feito.",
    featured: false,
    cta: "Começar agora",
    features: [
      "1 unidade",
      "Alterações ilimitadas",
      "QR Code em alta resolução",
      "Sem taxa por pedido",
      "Suporte padrão",
    ],
  },
  {
    id: "completo",
    name: "Completo",
    price: "39",
    period: "/mês",
    blurb: "O plano da casa que quer vender mais — e atualizar à hora.",
    featured: true,
    badge: "Mais Popular",
    cta: "Começar Teste Grátis",
    features: [
      "Até 3 unidades",
      "Suporte prioritário",
      "Alterações ilimitadas",
      "QR Code em alta resolução",
      "Sem taxa por pedido",
      "Fotos em alta definição",
      "Destaque de pratos do dia",
    ],
  },
  {
    id: "parceiro",
    name: "Parceiro",
    price: "79",
    period: "/mês",
    blurb: "Rede, grupo ou operação com várias frentes.",
    featured: false,
    cta: "Falar com especialista",
    features: [
      "Unidades ilimitadas",
      "Gerente de conta",
      "Identidade visual avançada",
      "Relatórios de acesso",
      "Onboarding assistido",
    ],
  },
] as const;

export const faqs = [
  {
    q: "Como funciona o suporte técnico?",
    a: "No plano Completo e Parceiro o suporte é prioritário — chat e e-mail em horário comercial, com SLA de primeira resposta no mesmo dia útil. O Essencial tem base de ajuda e atendimento padrão. Ninguém fica sozinho na sexta à noite com QR fora do lugar: o status da conta e o cardápio são monitoráveis no painel.",
  },
  {
    q: "Existe taxa de adesão?",
    a: "Não. Você entra no plano mensal, configura o cardápio e gera o QR. Sem setup fee, sem fidelidade escondida, sem surpresa na fatura. Cancele quando quiser — o cardápio digital não precisa de contrato de gráfica.",
  },
  {
    q: "Como funciona a alteração do cardápio?",
    a: "Você edita no painel: preço, foto, descrição, disponibilidade. Publicou, a mesa seguinte já vê. Esgotar um prato, lançar o executivo do dia ou corrigir um dígito leva segundos — sem mandar nada para gráfica e sem circular avisando a equipe com post-it.",
  },
  {
    q: "Quais formatos de impressão do QR Code vocês entregam?",
    a: "PNG em alta resolução, SVG vetorial e PDF pronto para gráfica. Serve para plaquinha de mesa, display de balcão, cardápio de entrada e adesivo. Você imprime uma vez. O conteúdo, a gente atualiza todas as outras.",
  },
] as const;
