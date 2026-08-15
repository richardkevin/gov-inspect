<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# nf-brasil

Navegador de Notas Fiscais Eletrônicas do Poder Executivo Federal (dados abertos do Portal da Transparência / CGU). Next.js 16 App Router, React 19, MUI v9, MUI X DataGrid, better-sqlite3. Toda a UI é em pt-BR.

## Comandos

- Dev/build: `npm run dev` | `npm run build` | `npm run start`
- Lint = `biome check` (não auto-corrige). Formatação de imports só com `npx biome check --write` — o script `npm run format` (`biome format --write`) NÃO reordena imports.
- Typecheck (não há script): `npx tsc --noEmit` (`npm run build` também checa tipos).
- Dados: `npm run dados:baixar` baixa os ZIPs de NFe 2026 da CGU para `data/csv`; `npm run dados:importar` gera `data/db/notas.db` a partir dos CSVs. `data/` é gitignored e o app abre o banco somente-leitura — em clone novo a tabela só funciona após rodar os dois scripts.

## Arquitetura

- `app/notas/page.tsx` é server component: faz o fetch inicial direto do SQLite (SSR) e repassa props ao cliente.
- `app/_components/TabelaNotas.tsx`: DataGrid client-side com paginação/ordenação no servidor via `GET /api/notas` e detalhe via `GET /api/notas/[chave]` (a chave é sanitizada com `\D`). Alterar colunas aqui e em `lib/db.ts`.
- `lib/db.ts` é a única camada de acesso ao banco. Colunas `snake_case` do SQL viram `camelCase` via `normalizarLinha` — ao adicionar coluna, siga esse mapeamento.
- `lib/portal-transparencia.ts` + `app/_components/nf.tsx` servem apenas a página inicial `/` (API da CGU, requer `GOV_API_KEY`). A tabela de `/notas` NÃO usa isso.
- `/api-docs` renderiza (Swagger UI) o `docs/openapi.yaml`, spec oficial da CGU (~8.7k linhas) — não editar à mão.
- Rotas e páginas usam `export const dynamic = "force-dynamic"`.

## Filtros multi-select

- Opções vêm de uma janela-buffer de 6 páginas (`BUFFER_PAGINAS = 6` em `app/api/notas/route.ts`; `25 * 6` no SSR de `page.tsx`), não só da página atual.
- O cliente mescla os valores selecionados de volta em `opcoesComSelecionados` (useMemo) para não sumirem do dropdown.
- `SelectMulti` limita o menu a `MAX_EXIBIDOS = 200` itens e exige busca quando há mais de `LIMITE_SEM_BUSCA = 400` opções.
- Filtros são digitados em `filtrosDigitados` e só aplicados em "Aplicar" (viram `filtros`). `meses` inicia pré-selecionado com todos os meses do recorte.
- Mês é armazenado como `"YYYY-MM"` e exibido como `"MM/YYYY"` via prop `formatarOpcao` do SelectMulti.
- Ordem atual das colunas: Emissão, Município, Órgão superior, Órgão destinatário, Emitente, Valor.

## Gotchas

- `next.config.ts` define `reactCompiler: true` e `serverExternalPackages: ["better-sqlite3"]` — o nativo do better-sqlite3 não pode ser bundled pelo Next.
- Após adicionar/remover route handlers, o `.next` guarda tipos obsoletos e o `next build` falha com erros de tipo de rotas deletadas → `rm -rf .next` antes de buildar.
