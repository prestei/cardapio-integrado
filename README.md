# Cardápio Integrado

Ecossistema **SaaS multi-tenant** para food service: painel administrativo, cardápio público e API central com PostgreSQL.

| App | Pasta | Porta |
|-----|--------|-------|
| API + painel | `cardapio-adm` | API `3333` · Web `5177` |
| Cardápio público | `cardapio-on` | `5174` |

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind, TanStack Query
- **API:** Node.js, Express, Prisma, Zod, JWT
- **Banco:** PostgreSQL
- **Realtime:** SSE (menu + KDS)
- **Pagamentos:** adaptadores mock / Mercado Pago (PIX + checkout online)
- **Maps:** Google Places/Geocode (opcional)

## Funcionalidades

- Multi-tenant com isolamento por estabelecimento
- Cardápio, categorias, produtos, adicionais e cupons
- Pedidos (entrega, retirada, no local) + status operacional
- KDS (cozinha) em tempo real
- Caixa (abertura, sangria, fechamento)
- Promoções, banners e campanhas
- Relatórios com comparação de período
- Alertas no dashboard
- Pedidos agendados
- Favoritos, histórico e recompra
- Notificações (WhatsApp, e-mail, push) por adaptadores
- Acessibilidade (foco, ARIA, `prefers-reduced-motion`)

## Como rodar

```bash
# 1) Painel + API
cd cardapio-adm
npm install
cp apps/api/.env.example apps/api/.env   # ajuste secrets
npm run db:local:start                   # ou docker compose
npm run db:migrate
npm run db:seed
npm run dev

# 2) Cardápio público (outro terminal)
cd cardapio-on
npm install
# frontend/.env → VITE_API_URL=http://localhost:3333/api
npm run dev
```

- Painel: http://localhost:5177  
- Cardápio: http://localhost:5174/{slug}  
- API: http://localhost:3333/api  

Demo seed: `admin@demo.com` / `demo1234` · slug `burger-house`

## Documentação

- `docs/AUDITORIA_ETAPA_GESTAO_OPERACAO.md`
- `docs/RELATORIO_ETAPA_GESTAO_OPERACAO.md`

## Segurança

Nunca versionar `.env`. Pagamentos só são confirmados via webhook no servidor — nunca pelo frontend.
