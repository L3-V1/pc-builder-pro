# PC Builder Pro

Montador visual de PCs. Estado atual (Fase 3): busca de Peças, montagem por clique e painéis de Orçamento, Checklist e Alertas. Em memória: recarregar a página zera a Build.

## Como rodar

```bash
npm install
npm run dev        # servidor de desenvolvimento
npm test           # testes (Vitest)
npm run test:e2e   # testes de ponta a ponta (Playwright, Chromium; requer `npx playwright install chromium` uma vez)
npm run lint       # oxlint + prettier --check
npm run typecheck  # tsc -b
npm run build      # build de produção
```

## Catálogo

As peças ficam em `src/catalogo/dados/<categoria>.json`, e a data de referência em
`meta.json`. O schema (Zod) está em `src/catalogo/schema.ts` e `carregarCatalogo()` valida tudo
ao carregar.

Os preços são **estimativas** em R$ (faixa mín, médio e máx) e serão revisados na curadoria
da Fase 8.
