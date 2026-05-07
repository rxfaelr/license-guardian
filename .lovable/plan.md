## Contexto

O projeto está configurado para Cloudflare Workers através do `@lovable.dev/vite-tanstack-config`, que injeta o plugin Cloudflare e gera saída em formato Worker (não compatível com a Vercel). Resultado: 404 ao publicar na Vercel porque não há `index.html` na raiz do build.

A boa notícia: a aplicação **não usa nenhum recurso de servidor** — não há `createServerFn`, nem rotas em `src/routes/api/`, nem acesso a `process.env`. Toda a persistência é via `localStorage` (`src/lib/storage.ts`). Ou seja, não precisamos de SSR nem de funções serverless na Vercel.

## Estratégia

Converter o build para **SPA estático** (TanStack Router puro, sem TanStack Start/SSR). A Vercel então serve um diretório `dist/` simples com fallback para `index.html` — solução mais robusta e barata, sem depender de adapters específicos.

## Mudanças no código

1. **`vite.config.ts`** — substituir o preset `@lovable.dev/vite-tanstack-config` por uma configuração Vite padrão com:
   - `@vitejs/plugin-react`
   - `@tailwindcss/vite`
   - `vite-tsconfig-paths`
   - `@tanstack/router-plugin/vite` em modo `target: 'react'` (gera o route tree para TanStack Router, sem Start)

2. **`src/router.tsx`** — manter como está; já usa `createRouter` de `@tanstack/react-router`.

3. **`src/routes/__root.tsx`** — remover `HeadContent`, `Scripts`, `shellComponent` e o wrapper `<html><body>`. Em SPA isso vai no `index.html`. O root passa a exportar apenas `component: RootComponent` com `<Outlet />` + `<Toaster />` + `notFoundComponent`.

4. **`index.html`** (novo, na raiz) — shell HTML com `<link rel="icon" href="/favicon.png">`, meta tags base e `<div id="root">` + `<script type="module" src="/src/main.tsx">`.

5. **`src/main.tsx`** (novo) — bootstrap client-side:
   ```ts
   import { RouterProvider } from "@tanstack/react-router";
   import { createRoot } from "react-dom/client";
   import { getRouter } from "./router";
   import "./styles.css";
   createRoot(document.getElementById("root")!).render(
     <RouterProvider router={getRouter()} />
   );
   ```

6. **`package.json`** — remover dependências não usadas: `@tanstack/react-start`, `@cloudflare/vite-plugin`, `@lovable.dev/vite-tanstack-config`. Manter `@tanstack/react-router` e `@tanstack/router-plugin`.

7. **Apagar** `wrangler.jsonc` e `src/routeTree.gen.ts` (será regenerado).

8. **`vercel.json`** — manter com o rewrite SPA (já está correto para esse modelo):
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```

## Configuração na Vercel

Ao importar o repositório:

| Campo | Valor |
|---|---|
| Root Directory | `./` (raiz) |
| Framework Preset | **Vite** |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

Não precisa de variáveis de ambiente (a app não usa nenhuma).

## Riscos / observações

- Como a app é toda client-side com `localStorage`, SPA é o modelo natural. Nada de SSR/SEO é perdido em relação ao que já existia.
- Os arquivos de rota (`src/routes/*.tsx`) **não mudam** — o `router-plugin` continua gerando o `routeTree.gen.ts` automaticamente.
- Após aprovar, vou rodar o build local para validar antes de você subir na Vercel.
