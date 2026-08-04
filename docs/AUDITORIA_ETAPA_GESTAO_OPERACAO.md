# Auditoria — Etapa Gestão, Operação, Pagamentos e Experiência

Data: 2026-08-02  
Projetos: `cardapio-adm` (API + web) · `cardapio-on` (frontend público)

## Arquitetura encontrada

```
CARDAPIO-ADM web (:5177) ──JWT──► API Express (:3333) ──Prisma──► PostgreSQL
CARDAPIO-ON  (:5174)     ──public──► API (SSE menu + REST)
```

Padrão API: `routes → controllers → services → repositories`.  
Tenant: `req.user.establishmentId` do JWT.  
Realtime menu: SSE `/api/public/:slug/events`.

## Funcionalidades existentes

- Auth, dashboard metrics, pedidos, categorias, produtos, adicionais, cupons, clientes, entregas, usuários, QR, settings
- Público: menu, checkout, tracking, cupom, SSE menu
- `Order.isScheduled` / `scheduledFor` no schema (não ligados no create público)
- `Product.stock` no schema (sem UI / sem baixa)
- `Payment` PENDING no create (sem gateway)
- `Notification` criada no pedido (sem listagem / sem adapters)

## Parcialmente prontos

| Item | Estado |
|------|--------|
| Relatórios | Mesmo `/dashboard/metrics` + CSV |
| Comparação período | Campo `comparison` já existe nas metrics |
| Promoções | Só `promoPrice` + cupons |
| Banner | `Establishment.bannerUrl` único |
| Agendamento | Settings `allowScheduledOrders` |
| Cozinha | Role KITCHEN, sem tela KDS |
| Pagamentos | Enums + registro PENDING |

## Modelos a criar / estender

- `Promotion`, `PromotionProduct`, `PromotionCategory`
- `Banner`, `Campaign` (+ vínculos)
- `CashRegister`, `CashMovement`
- `PaymentIntent` / campos em `Payment` (provider, externalId, qrCode, copyPaste, expiresAt, rawEvents)
- `NotificationLog`, `NotificationSetting`
- `CustomerFavorite`
- `Alert` opcional ou alerts calculados on-the-fly
- Order SSE channel para KDS
- Address lat/lng opcional

## Estratégia

1. Migration não destrutiva.
2. Gateways via adapters (`MockPaymentProvider` em development; MercadoPago/Asaas se env definido).
3. Notificações via adapters (log em dev; WhatsApp/Email/Push se credenciais).
4. Maps: Places Autocomplete se `GOOGLE_MAPS_API_KEY`; fallback manual.
5. Favoritos: tabela + phone/customerId; público via localStorage sync + API por telefone.
6. Reutilizar metrics e estender reports.
7. KDS: rota `/cozinha` + SSE pedidos.
8. Acessibilidade incremental em componentes críticos.

## Riscos

- Sem credenciais reais: modo mock documentado, nunca “aprovado” em production sem provider.
- Stock: alertas de indisponibilidade reais; estoque quantitativo só se `stock` preenchido.
- Não quebrar checkout atual.

## Plano

Migration → API módulos → Painel → Público → A11y → Docs/build.
