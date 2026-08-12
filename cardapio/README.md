# LUME / Cardápio Online — integração com painel

Cardápio público do cliente. Consome a API do `cardapio-adm`.

## Rodar junto com o admin

```bash
# Terminal 1 — painel + API
cd cardapio-adm
npm run db:local:start   # se o Postgres local ainda não estiver up
npm run dev              # API :3333 + Web :5173

# Terminal 2 — cardápio público
cd cardapio
npm run dev              # :5177
```

Abra: **http://localhost:5177/burger-house**

No painel, **Ver cardápio** aponta para `VITE_PUBLIC_MENU_URL` (`http://localhost:5177/{slug}`).

## Variáveis

| Var | Padrão | Descrição |
|-----|--------|-----------|
| `VITE_API_BASE` | `/api/public` | Base da API pública (proxy Vite → `:3333`) |
| `VITE_DEFAULT_SLUG` | `burger-house` | Slug usado em `/` |
| `VITE_USE_MOCK` | `false` | `true` = dados mock locais |
| `VITE_ADMIN_URL` | `http://localhost:5173` | Link de volta ao painel |

## Endpoints usados

- `GET /api/public/:slug/menu`
- `GET /api/public/:slug/products/:productId`
