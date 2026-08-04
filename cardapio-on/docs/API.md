# API REST — Cardápio Online

Base URL: `http://localhost:3334/api`

## Saúde

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Status da API |

## Público (cardápio)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/public/:slug/menu` | Cardápio completo do estabelecimento |
| GET | `/public/:slug/products/:productId` | Detalhe do produto (variações/adicionais) |
| POST | `/public/:slug/orders` | Criar pedido |
| GET | `/public/:slug/orders/:code` | Acompanhar pedido |
| POST | `/public/:slug/delivery/calculate` | Calcular taxa de entrega |
| POST | `/public/:slug/coupons/validate` | Validar cupom |

### Criar pedido — body

```json
{
  "type": "DELIVERY",
  "customer": { "name": "Bruno", "phone": "11999999999" },
  "address": {
    "street": "Rua Exemplo",
    "number": "120",
    "neighborhood": "Centro",
    "city": "São Paulo"
  },
  "paymentMethod": "PIX",
  "notes": "Sem cebola",
  "items": [
    {
      "productId": "...",
      "quantity": 2,
      "notes": "Ponto da carne mal passado",
      "additionals": [{ "additionalId": "...", "quantity": 1 }]
    }
  ]
}
```

## Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login` | Login administrador |
| POST | `/auth/register` | Criar conta + estabelecimento |
| POST | `/auth/logout` | Logout (cliente) |
| GET | `/auth/me` | Usuário autenticado (Bearer JWT) |

```json
{ "email": "dono@demo.com", "password": "demo1234" }
```

## Admin (JWT)

O painel em `admin/` consome estas rotas autenticadas:

| Prefixo | Uso |
|---------|-----|
| `/products` | CRUD de produtos |
| `/categories` | CRUD de categorias |
| `/orders` | Pedidos do estabelecimento |
| `/dashboard` | Métricas |
| `/establishment` | Dados da loja |

Aliases também disponíveis: `/admin/products`, `/admin/categories`, `/admin/orders`.

Use header: `Authorization: Bearer <token>`

Credenciais demo: `dono@demo.com` / `demo1234`
