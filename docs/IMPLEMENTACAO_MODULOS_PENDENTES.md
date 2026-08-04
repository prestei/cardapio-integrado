# Auditoria — Módulos Pendentes

Data: 2026-08-02  
Escopo: `cardapio-adm` + `cardapio-on` (integração existente)

## Arquitetura encontrada

```
cardapio-adm/
  apps/api     → Express + Prisma + PostgreSQL (fonte única)
  apps/web     → React + Vite + TanStack Query (painel)
cardapio-on/
  frontend     → React + Vite (cardápio público → API adm :3333)
```

Fluxo de dados: painel → API → PostgreSQL ← API ← cardápio público.  
Atualização de menu: SSE `GET /api/public/:slug/events` + React Query.

## Tecnologias

| Camada | Stack |
|--------|--------|
| Admin UI | React 19, Vite 6, Tailwind 4, RHF, Zod, TanStack Query |
| Público | React 19, Vite 8, TanStack Query, Motion/GSAP |
| API | Express 4, Prisma 6, Zod, JWT, bcrypt, Pino |
| DB | PostgreSQL (local 55432 / Docker 5432) |

## Estrutura relevante

- API: `routes → controllers → services → repositories → prisma`
- Admin: `pages + services + components/ui + AuthContext`
- Público: `StoreContext + services/menu|products|orders + SSE`

## Modelos existentes (reutilizar)

Já no schema e parcialmente usados:

- `AdditionalGroup`, `Additional`, `ProductAdditionalGroup` — **sem CRUD admin**
- `Coupon`, `CouponUsage` — **validação pública existe; sem CRUD admin / UI cupom**
- `DeliveryZone` — **leitura pública; sem CRUD admin**
- `Settings`, `BusinessHours`, `Establishment` — **GET/PATCH parcial; UI placeholder**
- `Customer`, `Address` — **criados no pedido; sem módulo admin**
- `User` + `UserRole` — **auth OK; sem gestão de equipe**
- `Order.statusHistory` (JSON) — **grava status; sem timeline rica / tabela**

## Funcionalidades prontas

- Auth (login/cadastro/reset), dashboard, pedidos, categorias, produtos
- Menu público, carrinho, checkout, tracking, SSE de menu
- Multi-tenant via JWT `establishmentId`

## Parcialmente prontas

| Item | Estado |
|------|--------|
| Adicionais | Schema + validação no pedido público |
| Cupons | Schema + validate no público |
| Entrega | Zonas no seed + calculateDelivery |
| Configurações | PATCH establishment básico |
| Permissões | `permissions.ts` existe mas **não é usado nas rotas** |
| Histórico | JSON em `Order.statusHistory` |

## Alterações necessárias no banco

1. Campos em `AdditionalGroup` / `Additional` / `ProductAdditionalGroup`
2. Expandir `Settings` (modalidades, políticas, pedido mínimo entrega, etc.)
3. Expandir `Establishment` (displayName, cidade/UF/CEP, accent, closedReason)
4. `DeliveryZone`: tipo, mínimo, ordem, CEP/raio opcional
5. `Coupon`: FREE_DELIVERY, limite por cliente, arquivado
6. `BusinessHours`: remover unique dia único → permitir múltiplos períodos
7. Tabelas: `OrderStatusHistory`, `QrCode`
8. `Order`: agendamento + entregador atribuído

## Endpoints a criar/alterar

- CRUD `/api/additional-groups` (+ options + link products)
- CRUD `/api/coupons`
- CRUD `/api/delivery-zones` (+ deliveries operacionais)
- CRUD `/api/customers` (+ detalhe)
- CRUD `/api/users` (equipe)
- Expandir `/api/establishment` (settings, hours, policies, slug)
- `/api/orders/:id/history` + enriquecer status update
- `/api/qr-codes`
- Público: settings/modalidades já no menu; cupom UI; validações reforçadas

## Componentes reutilizados

Admin: `PageHeader`, `Modal`, `Button`, `Input`, `Select`, `Textarea`, `Badge`, `EmptyState`, `Skeleton`, padrões de `ProductsPage`/`CategoriesPage`.  
Público: `Checkout`, `ProductModal`, `StoreContext`, services existentes.

## Riscos de compatibilidade

- Remover `@@unique([establishmentId, dayOfWeek])` exige migration cuidadosa
- Enum `CouponType` + FREE_DELIVERY exige migration Prisma
- Cardápio público já espera `settings.acceptDelivery|Pickup|DineIn` (hoje hardcoded `true` no service) — alinhar com Settings reais
- Seed e estabelecimentos existentes precisam defaults seguros

## Plano de implementação

1. Migration schema (não destrutiva)
2. Middleware `requirePermission` + matriz ampliada
3. APIs dos módulos (tenant sempre do JWT)
4. Páginas admin substituindo placeholders
5. Cardápio: cupom, modalidades, mensagens de validação
6. QR Code (PNG/print/link)
7. Docs API + relatório final + typecheck/build

Decisões:

- Valores monetários permanecem `Decimal(10,2)` (padrão atual).
- Soft-delete de grupos vinculados a pedidos históricos → `isActive=false` (não hard delete).
- Relatórios: página com métricas reais do dashboard (sem export fantasma).
- Upload de imagem: manter URLs (padrão atual); validar URL/formato.
