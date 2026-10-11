# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

PC Builder Pro: a frontend-only (no backend), game-like 2D PC builder using real parts sold in Brazil, with estimated prices in R$. React 19 + Vite + TypeScript, Zod for schemas, dnd-kit for drag-and-drop, `motion` for animation. Deployed to GitHub Pages from `main` via CI (`base: './'` in `vite.config.ts` so the same build works under a subpath).

**Everything is in Brazilian Portuguese**: identifiers, file names, comments, UI text, tests, docs. Follow that. Commit messages are English conventional commits (`feat:`, `docs:`, `chore:`).

**Domain vocabulary is fixed in `GLOSSARY.md`** (Peça, Categoria, Catálogo, Build, Bandeja, Bancada, Slot, Incompatibilidade Bloqueante/Alerta, Orçamento, Meta, Checklist, Índice de desempenho, Perfil, Pontuação, Gargalo, Desafio…). Use those terms and avoid the listed `_Avoid_` synonyms, in code and in prose. Design decisions live in `docs/adr/`; phases and their status in `docs/roadmap-pc-builder-pro.md`; approved plans in `.plans/`.

## Commands

```bash
npm run dev            # Vite dev server
npm test               # Vitest (run once)
npx vitest run src/motor/pontuacao.test.ts   # single test file
npx vitest run -t "nome do teste"            # filter by test name
npm run test:coverage  # coverage, enforced at 90% only on src/motor/**
npm run test:e2e       # Playwright (builds + previews on :4173; projects "chromium" and "celular")
npx playwright test e2e/bancada.spec.ts --project=chromium   # single e2e spec
npm run lint           # oxlint + prettier --check
npm run format         # prettier --write
npm run typecheck      # tsc -b (app, node and pipeline tsconfigs)
npm run build
npm run pipeline       # regenerate public/dados/ from OpenDB (see below)
                       # no ML_CLIENT_ID/SECRET → legacy prices only; --sem-coleta / --exigir-coleta
```

CI (`.github/workflows/ci.yml`) runs lint → typecheck → test:coverage → build, then e2e and Lighthouse (`lighthouserc.json`), and publishes to Pages on push to `main`. Node version in `.nvmrc`. Prettier: no semicolons, single quotes, 100 cols.

## Architecture

### Data flow at runtime

`src/main.tsx` → `App.tsx` fetches the Catálogo (`src/catalogo/carregar.ts`: `fetch('dados/*.json')`, Zod-validated via `schema.ts`/`validar.ts`) behind a loading/error screen, and only then mounts `Aplicacao.tsx`. The Catálogo is **not bundled**; it lives in `public/dados/<categoria>.json` + `meta.json` + `aliases.json`.

`Aplicacao` holds a `useReducer(reduzirApp)` (`src/estado/app.ts`), which wraps per-Build state (`src/estado/build.ts`: Build, Bandeja, Meta, aviso). There is a free Build (`livre`) plus a separate Build per Desafio; `estadoAtivo()` picks the current one. Initial state comes from `iniciarApp` (`src/persistencia/`), combining localStorage and a shareable URL hash link; the hash is applied once then cleared.

### Modules (each has an `index.ts` barrel — import from the barrel)

- `src/motor/` — pure rules engine: encaixe, compatibilidade (Bloqueante vs Alerta), fonte, orçamento, checklist, meta, pontuação (Índices + Gargalos, see `docs/pontuacao.md`), desafio evaluation. No React. This is the coverage-gated core.
- `src/busca/` — search/filter/sort over Peças. `criarBuscaLocal` exposes an async `BuscarPecas` interface; `src/componentes/useBuscaPecas.ts` adds debounce (only text changes wait) and AbortController cancellation.
- `src/bancada/` — non-visual logic of the 2D Bancada: slot layout, drag handling, keyboard interaction, screen-reader announcements. The Bancada is SVG/DOM, not canvas (ADR 0002), so drag must work with keyboard, touch and screen readers.
- `src/persistencia/` — localStorage (state + Desafios), link encode/decode, and `remontar` (rebuild a Build from IDs, resolving legacy IDs through `aliases.json`).
- `src/desafios/` — Desafio definitions in `dados/desafios.json` + schema.
- `src/componentes/` — React components, each with a co-located `.css` and `.test.tsx`.

### Catálogo pipeline (`pipeline/`, run with `tsx`, own `tsconfig.pipeline.json`)

`npm run pipeline` (`pipeline/main.ts`): downloads the BuildCores OpenDB tarball at a pinned commit (`pipeline/config.ts`, cached in `pipeline/.cache/`) → normalizes each Categoria (`pipeline/normalizar/`, every discard has a reason) → joins hand-curated data in `pipeline/curadoria/` (CPU/GPU Índices, legacy-ID pairs) → applies price ranges and reference date from `pipeline/legado/` (only Peças with a legacy pair, and an Índice for CPU/GPU, are published) → validates with the app's own `src/catalogo/validar` → writes `public/dados/`. It exits non-zero without writing anything if a legacy ID fails to resolve or output is invalid. Report: `pipeline/.cache/relatorio.json`. To find OpenDB matches for a legacy Peça: `npx tsx pipeline/ferramentas/sugerir-pares.ts [idAntigo…]`.

**Do not hand-edit `public/dados/`.** Peça IDs are `categoria-marca-modelo`; old IDs must keep working (shared links, saved Builds, Desafio solutions) via `aliases.json`. OpenDB data is CC BY-NC-SA: keep the attribution in the footer. `docs/atualizar-catalogo.md` describes the pre-pipeline manual process and is partially outdated.

## Testing conventions

- Vitest default environment is `node`; component tests opt into jsdom with a `// @vitest-environment jsdom` first line. `src/teste/setup.ts` clears localStorage/hash after each test.
- Tests use the frozen fixture `src/teste/catalogo.json`, **not** the real Catálogo. Only the catalog data tests and Desafio-solution tests read `public/dados/` (through `src/teste/dadosPublicados.ts`). If a new test needs a Peça missing from the fixture, copy it from the real data keeping relative order (search relevance follows Catálogo order).
- E2E specs must import `test` from `e2e/ajudantes.ts`, which auto-intercepts `**/dados/*.json` with the fixture and provides helpers (`slot`, `aviso`, `brl`, price lookups). Every spec runs on both desktop and a mobile (Pixel 7) project; `e2e/acessibilidade.spec.ts` uses axe.
- `src/motor/teste-pecas.ts` holds Peça builders for engine tests.
