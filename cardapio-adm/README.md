# Cardápio Online — Painel Administrativo

Painel SaaS para gestão de cardápio, pedidos e operação de estabelecimentos alimentícios.

Stack: **React + TypeScript + Vite** (web) · **Node + Express + Prisma + PostgreSQL** (api)

Identidade visual: charcoal + âmbar (tema escuro profissional, sem visual genérico claro).

## Requisitos

- Node.js 20+
- PostgreSQL 16 (Docker **ou** instância local via script)

## Setup rápido

```bash
# 1. Dependências
npm install

# 2. Banco — escolha uma opção:

# Opção A: Postgres local embutido (sem Docker, porta 55432)
npm run db:local:start
# apps/api/.env já aponta para postgresql://cardapio@127.0.0.1:55432/cardapio

# Opção B: Docker Compose (porta 5432)
# npm run db:up
# Ajuste DATABASE_URL em apps/api/.env para:
# postgresql://cardapio:cardapio@localhost:5432/cardapio?schema=public

# 3. Migrações + seed
npm run db:migrate
npm run db:seed

# 4. Subir API + Web
npm run dev
```

- Web: http://localhost:5173  
- API: http://localhost:3333/api  

## Integração com o cardápio público

O botão **Ver cardápio** abre o front público (`cardapio-on`) no slug do estabelecimento:

`{VITE_PUBLIC_MENU_URL}/{slug}` → ex.: http://localhost:5177/burger-house

O front público consome a **mesma API** do painel (`localhost:3333`) via proxy Vite, então produtos/categorias criados no admin aparecem no cardápio.

| App | URL |
|-----|-----|
| Painel admin | http://localhost:5173 |
| Cardápio público | http://localhost:5177/{slug} |
| API | http://localhost:3333/api |

No `cardapio-on/frontend`, o proxy `/api` aponta para `3333` e `VITE_ADMIN_URL` para o painel.

## Contas demo

| E-mail | Função | Senha |
|--------|--------|-------|
| `dono@demo.com` | OWNER | `demo1234` |
| `admin@demo.com` | ADMIN | `demo1234` |
| `gerente@demo.com` | MANAGER | `demo1234` |

Estabelecimento seed: **Burger House Demo** (`burger-house`)

## Estrutura

```
apps/
  api/    # Express + Prisma + JWT
  web/    # React admin (Tailwind, TanStack Query, RHF + Zod)
scripts/
  pg-start.sh / pg-stop.sh   # Postgres local sem Docker
```

## Entrega atual

Funcional com API real:

- Autenticação (login, cadastro, recuperar/redefinir senha)
- Layout admin (sidebar + header responsivos)
- Dashboard com KPIs e gráficos
- Pedidos (tabela, cards mobile, Kanban, status)
- Categorias e produtos (CRUD)

Placeholders prontos para a próxima iteração: adicionais, cupons, clientes, entregas, relatórios, funcionários, configurações, suporte.

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | API + Web |
| `npm run build` | Build de produção |
| `npm run db:local:start` | Sobe Postgres em `.pgdata` |
| `npm run db:local:stop` | Para o Postgres local |
| `npm run db:migrate` | Prisma migrate |
| `npm run db:seed` | Dados de demonstração |
| `npm run db:up` | Docker Compose Postgres |

## Variáveis

Veja [`apps/api/.env.example`](apps/api/.env.example) e `apps/web/.env` (`VITE_API_URL`).
