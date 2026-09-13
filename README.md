# Members Hub

Área de membros premium para entrega de produtos digitais, com liberação de acesso
automática via webhook da Hotmart e conteúdos com liberação gradual (drip content).

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **PostgreSQL + Prisma 6** (ORM)
- **Autenticação própria**: sessão em cookie httpOnly assinado (JWT via `jose`), senhas com `bcrypt`
- **Tailwind CSS v4** (design system próprio, sem template de admin)
- **Resend** para e-mail transacional (com fallback de log no console em dev, se `RESEND_API_KEY` não estiver configurado)
- **Cloudflare R2** (S3-compatible) para armazenamento dos arquivos em produção, com fallback para disco local em desenvolvimento

## Rodando localmente

1. Suba um Postgres e configure `DATABASE_URL` no `.env` (copie de `.env.example`).
2. Instale as dependências e rode as migrations:

   ```bash
   npm install
   npx prisma migrate dev
   npm run seed
   ```

3. Suba o servidor:

   ```bash
   npm run dev
   ```

4. Contas criadas pelo seed:
   - **Admin:** `admin@membershub.com` / `admin123`
   - **Cliente de demonstração:** `cliente@example.com` / `demo12345` (senha provisória — o sistema vai pedir para trocar no primeiro acesso)

## Variáveis de ambiente

Veja `.env.example`. As mais importantes:

- `SESSION_SECRET`: segredo para assinar o cookie de sessão.
- `HOTMART_HOTTOK`: token que a Hotmart envia no header `X-HOTMART-HOTTOK` de cada webhook (configurado no painel do produtor, em Ferramentas → Webhook). O sistema recusa (`401`) qualquer requisição sem esse token exato.
- `RESEND_API_KEY` / `EMAIL_FROM`: envio das credenciais de acesso por e-mail. Sem a chave, as credenciais aparecem no log do servidor (útil em dev).
- `STORAGE_DRIVER`: `local` (padrão, grava em `./storage`) ou `r2` (Cloudflare R2 — preencha `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`).

## Integração com a Hotmart

Endpoint do webhook: `POST /api/webhooks/hotmart`.

Cadastre esse endereço no painel da Hotmart (Ferramentas → Webhook) e ative pelo menos o evento
de **compra aprovada**. O handler foi implementado a partir da estrutura documentada publicamente
pela Hotmart (envelope `{ event, data: { product, buyer, purchase } }`, autenticação por header
`X-HOTMART-HOTTOK`) — durante o desenvolvimento deste projeto o acesso direto a
`developers.hotmart.com` estava bloqueado pelo proxy de rede do ambiente, então **o payload bruto de
todo webhook recebido é sempre gravado em `webhook_events`** (visível em `/admin/webhooks`), mesmo
quando o processamento falha. Isso permite conferir rapidamente, com uma compra real ou pelo
simulador de webhook da Hotmart, se algum campo do payload precisa de ajuste — sem perder nenhum
evento no caminho.

Para que uma compra libere acesso automaticamente, o produto correspondente precisa estar
cadastrado no admin (`/admin/produtos`) com o **Hotmart Product ID** correto.

Eventos tratados:

- `PURCHASE_APPROVED` / `PURCHASE_COMPLETE` → cria o usuário (se novo) com senha provisória e
  envia por e-mail, ou libera o produto para quem já é cliente. Idempotente por `transactionId`
  (reenvios da Hotmart não duplicam o acesso).
- `PURCHASE_CANCELED` / `PURCHASE_REFUNDED` / `PURCHASE_CHARGEBACK` → revoga o acesso ao produto
  daquela transação.
- Demais eventos são registrados como "ignorados", sem efeito colateral.

## Decisões e simplificações deliberadas do MVP

- **Imagens de produto/conteúdo são URLs**, não upload — evita construir um segundo pipeline de
  upload/processamento de imagem só para capas. Os **arquivos de conteúdo** (o que o cliente
  baixa) já usam upload real, gravado no storage configurado.
- **Sem reprocessamento automático de webhook**: se a Hotmart mandar um `PURCHASE_APPROVED` para
  um `hotmartProductId` que ainda não existe no admin, o evento fica marcado como erro em
  `/admin/webhooks` — cadastre o produto e, se necessário, reenvie o evento pelo simulador da
  Hotmart.
- **`content_progress` (do rascunho inicial) foi removido**: o estado de bloqueio é sempre
  calculado on-the-fly a partir de `accessStart + releaseAfterDays`, sem precisar persistir por
  usuário/conteúdo — mais simples e sempre consistente.
- Toda checagem de acesso (produto do usuário, data de liberação do conteúdo) é refeita no
  servidor em cada página e no endpoint de download — nunca apenas no cliente, mesmo que a URL
  seja acessada diretamente.

## Estrutura

```
src/
  app/
    login/, primeiro-acesso/, esqueci-senha/     páginas públicas de autenticação
    (member)/dashboard/, (member)/produto/[slug] área do cliente
    admin/                                        painel administrativo
    api/webhooks/hotmart/                         webhook da Hotmart
    api/download/[fileId]/                        download protegido (checa acesso + liberação)
  lib/
    auth/        sessão, senha, guards (requireUser/requireAdmin)
    drip.ts       cálculo de liberação por dias
    storage.ts    adapter local/R2
    email.ts      envio de credenciais (Resend/mock)
    hotmart.ts    parsing e verificação do webhook
    purchase.ts   regra de negócio de conceder/revogar acesso
  proxy.ts        redireciona não-autenticados (checagem leve; autorização real é sempre no servidor)
prisma/
  schema.prisma
  seed.ts
```
