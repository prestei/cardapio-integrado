# Relatório de Implementação — Módulos Pendentes

Data: 2026-08-02

## Implementado

1. **Adicionais** — CRUD de grupos e opções, vínculo com produtos, soft-delete com histórico, SSE no menu
2. **Configurações** — tela com abas (gerais, identidade, horários, atendimento, pedido mínimo, domínio, políticas)
3. **Entregas** — zonas CRUD + operacional (atribuir entregador, horários de saída/conclusão)
4. **Cupons** — CRUD admin + campo aplicar/remover no checkout público + FREE_DELIVERY / limite por cliente
5. **Clientes** — listagem com busca/stats + detalhe com pedidos e endereços
6. **Funcionários** — gestão de equipe com roles e proteções de OWNER
7. **Histórico de status** — tabela `OrderStatusHistory` gravada nas mudanças de status
8. **QR Codes** — CRUD + preview/download/print via URL do cardápio
9. **Relatórios** — página real com métricas do dashboard
10. **Conta / Suporte** — páginas reais (não placeholder)
11. **Permissões** — matriz ampliada + `requirePermission` nas rotas
12. **Validações operacionais** — loja fechada, modalidades, cupom, taxa e preços recalculados no servidor

## Alterado

### Banco
- Migration `20260802224932_modules_pendentes`
- Novos/expandidos: Settings, Establishment, DeliveryZone, Coupon, BusinessHours, Order, OrderStatusHistory, QrCode, Additional*

### API (`cardapio-adm/apps/api`)
- Novos módulos: additional, coupon, delivery, customer, user, qr
- Establishment expandido (settings + business-hours)
- Orders com histórico permanente
- Public menu usa modalidades reais; cupom FREE_DELIVERY

### Painel (`apps/web`)
- Páginas: Additionals, Coupons, Deliveries, Customers, Employees, Settings, QrCodes, Reports, Account, Support
- Rotas e Sidebar atualizados (QR Codes + filtro por role)
- Services alinhados às rotas `/delivery/*`, `/additional-groups`, etc.

### Cardápio (`cardapio-on/frontend`)
- Checkout: cupom, modalidades filtradas, bloqueio se loja fechada, mensagem de pedido mínimo

## Segurança

- Tenant exclusivamente do JWT
- Permissões por role no backend
- Preços/taxa/desconto recalculados no servidor
- Soft-delete de grupos com histórico de pedidos
- Proteção do último OWNER

## Testes

- `tsc --noEmit` API ✓
- `tsc -b` web ✓
- `tsc -b` cardapio-on ✓
- `npm run build` adm (api+web) ✓
- `npm run build` cardapio-on ✓

## Pendências / decisões

| Item | Decisão |
|------|----------|
| Upload de arquivo (logo/banner) | Mantido padrão URL (sem multer/S3) |
| Múltiplos períodos/dia | Via várias linhas `BusinessHours` + `sortOrder` |
| Elegibilidade cupom por produto/categoria | Não modelada nesta fase (schema não tinha junction) |
| Pedido agendado UI completa | Flag/settings + campos no Order; UI pública mínima (backend preparado) |
| Relatórios avançados/export PDF | Relatórios usam métricas existentes + CSV no painel |
| npm run lint | Projeto não possui script `lint` unificado no root; typecheck/build cobrem a qualidade |

## Riscos

- Processos antigos nas portas 5174/5177/3333 podem conflitar ao subir `npm run dev`
- Frontend de adicionais assume `products: [{id,name}]` no GET do grupo — conferir shape se o backend retornar nest diferente
- Horários: UI envia até 2 períodos/dia; backend aceita lista aberta

## Como testar

```bash
# Terminal 1
cd cardapio-adm
npm run db:local:start
npm run db:migrate   # se ainda não rodou modules_pendentes
npm run dev
# → http://localhost:5177  API :3333

# Terminal 2
cd cardapio-on
npm run dev
# → http://localhost:5174/{slug}
```

Fluxos sugeridos:

1. Login → Configurações (cores, horários, modalidades) → Ver cardápio
2. Adicionais → criar grupo → opções → vincular produto → abrir produto no público
3. Cupons → criar → aplicar no checkout
4. Entregas → zona → pedido delivery → atribuir entregador
5. Funcionários → criar ATTENDANT → validar permissões
6. Pedidos → mudar status → ver histórico
7. QR Codes → gerar → baixar/imprimir

Docs:

- `docs/IMPLEMENTACAO_MODULOS_PENDENTES.md`
- `docs/API_MODULOS_PENDENTES.md`
- `docs/RELATORIO_IMPLEMENTACAO.md` (este arquivo)
