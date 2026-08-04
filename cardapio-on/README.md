# Cardápio Online Inteligente

Sistema completo de cardápio digital para restaurantes, bares, lanchonetes e negócios do setor alimentício — com **painel administrativo** integrado.

Identidade visual **dark + âmbar** (`#121212` / `#F2A94A`), pensada para parecer um produto comercial real — não um template genérico.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Cardápio público | React, TypeScript, Vite, Tailwind CSS, Motion, GSAP, Anime.js, Three.js |
| Painel admin | React, TypeScript, Vite, Tailwind CSS, React Query, Recharts |
| Backend | Node.js, Express, TypeScript, Zod, Prisma, JWT |
| Banco | PostgreSQL 16 |

## Estrutura

```text
frontend/     # Cardápio público (cliente)
admin/        # Painel do estabelecimento
backend/      # API REST + Prisma
database/     # Docker Compose (PostgreSQL)
docs/         # Documentação da API
```

## Pré-requisitos

- Node.js 20+
- Docker (para PostgreSQL) ou Postgres local
- npm 10+

## Instalação rápida

```bash
npm run setup
npm run dev
```

Isso instala deps, gera Prisma, aplica migrations, faz seed e sobe **API + cardápio + painel**.

## URLs

| Serviço | URL |
|---------|-----|
| Cardápio | http://localhost:5174/burger-house |
| Painel admin | http://localhost:5180 |
| Login admin | http://localhost:5180/login |
| Atalho `/login` no cardápio | redireciona para o painel |
| API | http://localhost:3334/api |
| Health | http://localhost:3334/api/health |

> O painel usa a porta **5180** para não conflitar com o `cardapio-adm` na 5173. Ajuste `admin`/`VITE_ADMIN_URL` se preferir outra porta.

> A API usa a porta **3334** por padrão (para não conflitar com outros projetos na 3333). Ajuste `PORT` em `backend/.env` se necessário.

No painel, o botão **Ver cardápio** abre o frontend público do estabelecimento (`VITE_PUBLIC_MENU_URL`).

## Credenciais demo

```text
E-mail: dono@demo.com
Senha:  demo1234
```

Estabelecimento seed: **Burger House Demo** (`burger-house`)

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | API + cardápio + painel |
| `npm run dev:admin` | Só o painel |
| `npm run dev:frontend` | Só o cardápio público |
| `npm run dev:backend` | Só a API |
| `npm run build` | Build de produção (3 apps) |
| `npm run db:up` | Sobe PostgreSQL |
| `npm run db:migrate` | Aplica migrations |
| `npm run db:seed` | Dados de exemplo |
| `npm run db:reset` | Reset do banco |

## Fluxo integrado

1. Dono acessa o **painel** (`:5173`), faz login e gerencia produtos/categorias/pedidos
2. Cliente abre o **cardápio** (`:5174/burger-house`) e faz o pedido
3. Pedido é salvo na mesma API/banco e aparece em **Pedidos** no painel
4. WhatsApp abre com a mensagem organizada do pedido

## Variáveis

**backend/.env** — `DATABASE_URL`, `JWT_SECRET`, `PORT`, `FRONTEND_URLS`  
**frontend/.env** — `VITE_API_URL`, `VITE_DEFAULT_SLUG`, `VITE_ADMIN_URL`  
**admin/.env** — `VITE_API_URL`, `VITE_PUBLIC_MENU_URL`

## Documentação

Veja [docs/API.md](./docs/API.md) para o contrato REST completo.

## Produção

```bash
npm run build
# Configure DATABASE_URL, JWT_SECRET e FRONTEND_URLS no backend/.env
npm run start
```

Sirva `frontend/dist` e `admin/dist` com Nginx/CDN e aponte `/api` para o backend.
