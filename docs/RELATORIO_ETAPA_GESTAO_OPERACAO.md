# Relatório — Etapa Gestão, Operação, Pagamentos e Experiência

Data: 2026-08-02  
Escopo: CARDAPIO-ADM (API + painel), CARDAPIO-ON (cardápio público), PostgreSQL.

Auditoria prévia: `docs/AUDITORIA_ETAPA_GESTAO_OPERACAO.md`.

---

## Implementado

### Banco / migrations
- Migration incremental `gestao_operacao` aplicada (promoções, banners, campanhas, caixa, eventos de pagamento, favoritos, settings de agendamento/notificação, campos de pagamento gateway).
- Índices por estabelecimento, status e datas.

### 1. Promoções, banners e campanhas
- CRUD na API com isolamento por tenant (JWT).
- Tipos de promoção alinhados ao Prisma (`PERCENTAGE`, `FIXED`, `PROMO_PRICE`, `BUY_X_GET_Y`, `COMBO`, `FREE_DELIVERY`, `CATEGORY`, `PRODUCT`).
- Painel `/marketing` alinhado ao contrato da API (sem broadcast fictício).
- Cardápio público: endpoints `/public/:slug/promotions` e `/banners`; UI com banners e promoções; SSE de menu invalida cache.

### 2. Relatórios
- Endpoints `/reports/{sales,products,customers,payments,operations}` e métricas no dashboard.
- Cálculos no servidor; comparação com período anterior equivalente (`utils/period.ts`).
- Painel Relatórios com filtros de período.

### 3. Comparação com período anterior
- Dashboard e relatórios exibem variação % (receita, pedidos, ticket).
- Sem base suficiente, a UI não inventa crescimento.

### 4. Alertas (dashboard)
- `GET /dashboard/alerts` com produtos indisponíveis, sem imagem, sem preço, promoções vencidas, pedidos aguardando/atrasados, falhas de pagamento.
- Painel mapeia severidade `error` → `critical` e monta títulos/links.

### 5. Caixa
- API: abrir, movimentos, fechar, histórico; um caixa aberto por estabelecimento.
- Painel `/caixa` alinhado (`openingAmount`, `INCOME`/`BLEED`, `status OPEN|CLOSED`).

### 6. KDS
- Tela `/cozinha` + `GET /kds/orders` + SSE `/kds/events`.
- Auth SSE aceita `?token=` (EventSource não envia Bearer).
- Eventos `order:created` / `order:status-changed`.

### 7. Notificações
- Adaptadores: WhatsApp, E-mail, Push, Console.
- `NotificationSetting` + UI em Configurações → Notificações.
- Envio assíncrono; falha não bloqueia pedido; logs de tentativa.

### 8. Google Maps
- Autocomplete e geocode via `GOOGLE_MAPS_API_KEY` no backend.
- Checkout público com `AddressAutocomplete` e fallback manual.

### 9. PIX real
- Gateway factory: `mock` | `mercadopago`.
- Intent, QR, copia-e-cola, expiração, webhook com segredo, idempotência de eventos.
- Mercado Pago sem token **não** marca sucesso silencioso.

### 10. Cartão online
- Método `ONLINE` cria Checkout Preference (Mercado Pago) com `checkoutUrl`.
- Mock devolve URL de checkout fictícia apenas em `PAYMENT_PROVIDER=mock`.
- Confirmação somente via webhook.

### 11. Pedido agendado
- Settings: antecedência, slot, máximo por faixa.
- Validação no create do pedido; UI no checkout (Agora / Agendar).

### 12. Favoritos, histórico e recompra
- Favoritos por telefone (sem auth paralela de cliente).
- Histórico e recompra com recálculo de preços no servidor.

### 13. Acessibilidade
- Foco visível, `role`/`aria` em abas e combobox de endereço, `prefers-reduced-motion` no ADM e ON, labels e `aria-live` em pagamento.

---

## Arquivos alterados (principais)

### API (`cardapio-adm/apps/api`)
- `prisma/schema.prisma` + migration `gestao_operacao`
- `middlewares/auth.ts` (token SSE)
- `services/dashboard.service.ts`, `cash.*`, `payment.*`, `geo.service.ts`
- `payments/providers/{Mock,MercadoPago}PaymentProvider.ts`
- `notifications/*`
- Rotas: promotions, banners, campaigns, cash, kds, reports, notification-settings, webhooks, public geo/pay/favorites

### Painel (`cardapio-adm/apps/web`)
- `pages/{Marketing,Cash,Kitchen,Reports,Dashboard,Settings}Page.tsx`
- `services/{cash,dashboard,promotions,banners,campaigns,notificationSettings,kds}.ts`
- `types/index.ts`, `index.css`

### Cardápio público (`cardapio-on/frontend`)
- `components/{AddressAutocomplete,Checkout,PixPayment,BannerCarousel}.tsx`
- Favoritos / histórico / agendamento (já existentes, mantidos)

### Docs
- `docs/AUDITORIA_ETAPA_GESTAO_OPERACAO.md`
- `docs/RELATORIO_ETAPA_GESTAO_OPERACAO.md` (este arquivo)

---

## Banco

| Item | Detalhe |
|------|---------|
| Migration | `20260802231710_gestao_operacao` (nome conforme pasta local) |
| Modelos | Promotion(+links), Banner, Campaign(+links), CashRegister, CashMovement, PaymentEvent, NotificationLog, NotificationSetting, CustomerFavorite |
| Campos Order | `isScheduled`, `scheduledFor` |
| Campos Payment | provider, externalId, qrCodeBase64, copyPaste, checkoutUrl, expiresAt |
| Settings | agendamento + flags notify |

---

## API (endpoints novos/relevantes)

| Área | Métodos |
|------|---------|
| Promoções | `GET/POST /promotions`, `GET/PATCH/DELETE /promotions/:id` |
| Banners | `GET/POST /banners`, `PATCH/DELETE /banners/:id` |
| Campanhas | `GET/POST /campaigns`, `PATCH/DELETE /campaigns/:id` |
| Caixa | `GET /cash/current`, `POST /cash/open`, `POST /cash/:id/movements`, `POST /cash/:id/close`, `GET /cash/history` |
| KDS | `GET /kds/orders`, `GET /kds/events` (SSE) |
| Relatórios | `GET /reports/*`, `GET /dashboard/metrics`, `GET /dashboard/alerts` |
| Notificações | `GET/PATCH /notification-settings` |
| Pagamentos | `POST /public/:slug/orders/:code/pay`, `POST /webhooks/payments/:provider` |
| Geo | `GET /public/:slug/geo/autocomplete`, `POST /public/:slug/geo/geocode` |
| Favoritos/recompra | `/public/:slug/favorites*`, `/public/:slug/reorder` |

Tenant sempre do JWT (painel) ou slug do estabelecimento (público). Nunca confiar em `establishmentId` do body.

---

## Painel (telas)

- `/marketing` — promoções, banners, campanhas
- `/relatorios` — visão geral / vendas / produtos / clientes / pagamentos / operação
- `/caixa` — abertura, movimentos, fechamento, histórico
- `/cozinha` — KDS
- Dashboard — comparação + alertas
- Configurações → Notificações — canais WhatsApp / E-mail / Push

---

## Cardápio público

- Banners e promoções ativas
- Checkout com agendamento e autocomplete de endereço
- PIX / ONLINE (QR ou checkoutUrl)
- Favoritos, histórico, recompra

---

## Integrações

| Integração | Modo | Observação |
|------------|------|------------|
| PIX | mock / Mercado Pago | Webhook obrigatório para confirmar |
| Cartão online | Preference Mercado Pago | Método `ONLINE` |
| Maps | Google Places/Geocode | Opcional; fallback manual |
| WhatsApp / E-mail / Push | Adaptadores | Credenciais via env; sem credencial = log/dev |

---

## Variáveis de ambiente (nomes)

```
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
PORT
NODE_ENV
FRONTEND_URL
FRONTEND_URLS
PAYMENT_PROVIDER
PAYMENT_WEBHOOK_SECRET
PAYMENT_WEBHOOK_URL
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_SANDBOX
MERCADOPAGO_MAX_INSTALLMENTS
GOOGLE_MAPS_API_KEY
NOTIFICATIONS_ENABLED
WHATSAPP_API_URL
WHATSAPP_API_TOKEN
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM
PUSH_VAPID_PUBLIC_KEY
PUSH_VAPID_PRIVATE_KEY
VITE_API_URL
VITE_PUBLIC_MENU_URL
```

Valores não documentados aqui de propósito.

---

## Testes

Comandos executados:

| Comando | Resultado |
|---------|-----------|
| `cardapio-adm`: `npm run build` (api `tsc` + web `tsc -b && vite build`) | OK |
| `cardapio-on/frontend`: `npm run build` | OK |
| `cardapio-on/frontend`: `npm run lint` (oxlint) | OK (apenas warnings pré-existentes de fast-refresh) |

Não há suite `npm run test` no monorepo ADM.  
`npm run typecheck` / `npm run lint` não existem na raiz do ADM; typecheck ocorre via `build`.

---

## Pendências

1. **Estoque quantitativo** — não existe no schema; alertas cobrem indisponibilidade/qualidade de cadastro (extensível).
2. **Exportação Excel/PDF** — CSV/servidor conforme suporte atual; PDF não foi adicionado sem biblioteca já presente.
3. **Métricas de campanha** — estrutura pronta (`views`/`clicks`/`ordersCount`/`revenue`); conversão só com eventos reais.
4. **Credenciais de produção** — Mercado Pago, Maps, SMTP, WhatsApp e Push dependem de secrets reais no ambiente.
5. **Vínculo produto/categoria em promoções na UI** — API aceita `productIds`/`categoryIds`; formulário do painel pode ser estendido para seleção multipla na próxima iteração.
6. **Testes automatizados E2E** — não há runner configurado; validação via build + fluxos manuais.

---

## Como configurar

1. Subir Postgres (`npm run predev` / scripts locais do ADM).
2. Copiar `apps/api/.env.example` → `.env` e preencher secrets.
3. `cd cardapio-adm && npm run db:migrate` (se necessário) + `npm run dev` → API `:3333`, painel `:5177`.
4. `cd cardapio-on && npm run dev` → frontend `:5174` com `VITE_API_URL=http://localhost:3333/api`.
5. Para PIX/cartão reais: `PAYMENT_PROVIDER=mercadopago`, token e `PAYMENT_WEBHOOK_SECRET`.
6. Para Maps: `GOOGLE_MAPS_API_KEY` (restringir por domínio/API no Google Cloud).

---

## Como testar (fluxos)

1. **Marketing** — criar promoção ACTIVE + banner; abrir `/:slug` no ON e ver atualização (SSE ou refetch).
2. **Caixa** — abrir → entrada/sangria → fechar com diferença; conferir histórico.
3. **KDS** — criar pedido no ON; abrir `/cozinha`; mudar status no painel; SSE deve atualizar.
4. **PIX mock** — pedido PIX → tela de tracking gera QR; webhook:
   `POST /api/webhooks/payments/mock` com header do secret e `externalId` + `status: approved`.
5. **Agendamento** — habilitar `allowScheduledOrders`; checkout → Agendar → validar horário inválido.
6. **Favoritos/recompra** — informar telefone → favoritar → histórico → Pedir de novo (preços recalculados).
7. **Multi-tenant** — logar em dois estabelecimentos; confirmar isolamento de caixa/promoções/relatórios.
8. **Alertas** — deixar produto indisponível; dashboard deve listar alerta real.

---

## Estratégia e riscos

- Nenhuma arquitetura paralela: reutilizou workspaces, Prisma, Express e React Query existentes.
- Contratos frontend/API foram alinhados (caixa, marketing, alertas, KDS SSE) para evitar telas “órfãs”.
- Integridade financeira: preço e status de pagamento só no servidor/webhook.
- Risco residual: providers reais exigem configuração externa; mock nunca deve ir para produção como confirmação silenciosa.
