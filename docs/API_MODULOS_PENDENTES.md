# API — Módulos Pendentes

Base: `http://localhost:3333/api`  
Auth admin: `Authorization: Bearer <JWT>`  
Tenant: sempre `req.user.establishmentId` (nunca do body).

## Adicionais

| Método | URL | Auth | Permissão |
|--------|-----|------|-----------|
| GET | `/additional-groups` | sim | `additionals:list` |
| POST | `/additional-groups` | sim | `additionals:manage` |
| GET | `/additional-groups/:id` | sim | `additionals:list` |
| PATCH | `/additional-groups/:id` | sim | `additionals:manage` |
| DELETE | `/additional-groups/:id` | sim | `additionals:manage` (soft se histórico) |
| POST | `/additional-groups/:id/additionals` | sim | `additionals:manage` |
| PATCH | `/additional-groups/additionals/:additionalId` | sim | `additionals:manage` |
| DELETE | `/additional-groups/additionals/:additionalId` | sim | `additionals:manage` |
| POST | `/additional-groups/:id/products` | sim | `additionals:manage` body `{ productId, sortOrder? }` |
| DELETE | `/additional-groups/:id/products/:productId` | sim | `additionals:manage` |

## Cupons

| Método | URL | Permissão |
|--------|-----|-----------|
| GET | `/coupons` | `coupons:list` |
| POST | `/coupons` | `coupons:manage` |
| GET | `/coupons/:id` | `coupons:list` |
| PATCH | `/coupons/:id` | `coupons:manage` |
| DELETE | `/coupons/:id` | `coupons:manage` |
| PATCH | `/coupons/:id/archive` | `coupons:manage` (se existir) |

Tipos: `PERCENTAGE`, `FIXED`, `FREE_DELIVERY`.

Público: `POST /public/:slug/coupons/validate` `{ code, subtotal }`

## Entregas

| Método | URL | Permissão |
|--------|-----|-----------|
| GET/POST | `/delivery/zones` | list / manage |
| GET/PATCH/DELETE | `/delivery/zones/:id` | list / manage |
| GET | `/delivery/orders` | `deliveries:list` |
| PATCH | `/delivery/orders/:id/assign` | `{ userId }` |
| PATCH | `/delivery/orders/:id/times` | `{ deliveryLeftAt?, deliveryCompletedAt? }` |

Público: `POST /public/:slug/delivery/calculate`

## Clientes

| Método | URL | Permissão |
|--------|-----|-----------|
| GET | `/customers?search=&page=&pageSize=` | `customers:list` |
| GET | `/customers/:id` | `customers:view` |
| PATCH | `/customers/:id` | `customers:update` |

## Equipe

| Método | URL | Permissão |
|--------|-----|-----------|
| GET | `/users` | `users:list` |
| POST | `/users` | `users:manage` |
| PATCH | `/users/:id` | `users:manage` |
| DELETE | `/users/:id` | `users:manage` |

Regras: não desativar último OWNER; OWNER não remove a si mesmo.

## Estabelecimento / Configurações

| Método | URL | Permissão |
|--------|-----|-----------|
| GET | `/establishment` | view (inclui settings + businessHours) |
| PATCH | `/establishment` | update (dados + slug + identidade) |
| PATCH | `/establishment/settings` | update |
| PUT | `/establishment/business-hours` | `{ hours: [...] }` |

## QR Codes

| Método | URL | Permissão |
|--------|-----|-----------|
| GET/POST | `/qr-codes` | list / manage |
| PATCH/DELETE | `/qr-codes/:id` | manage |

Kinds: `MENU`, `TABLE`, `COUNTER`, `SHOWCASE`, `SOCIAL`

## Pedidos / Histórico

| Método | URL | Notas |
|--------|-----|-------|
| PATCH | `/orders/:id/status` | grava `OrderStatusHistory` (source PANEL) |
| GET | `/orders/:id` | inclui statusLogs quando disponível |

## Público (inalterado + reforçado)

- `GET /public/:slug/menu` — modalidades reais do Settings
- `GET /public/:slug/events` — SSE
- `POST /public/:slug/orders` — recalcula preços, adicionais, cupom, taxa, pedido mínimo, loja aberta

## Erros padronizados

`{ "error": "mensagem" }` com status 400/401/403/404/409.
