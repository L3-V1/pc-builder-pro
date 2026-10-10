---
titulo: Catálogo fora do bundle, carregado por fetch
data: 2026-10-09
status: aprovado
---

# Plano: Catálogo fora do bundle, carregado por fetch

**Origem:** `docs/roadmap-pc-builder-pro.md`, Fase 9: Catálogo fora do bundle

> Dependência: a Fase 8 ainda tem o deploy no Pages pendente. Decisão do usuário: seguir, porque o deploy não é pré-requisito técnico (tudo roda no preview local, nos e2e e no Lighthouse).

## Objetivo

O app passa a buscar o Catálogo por `fetch` em `dados/*.json`, com tela de carregamento e tela de erro com "Tentar de novo". Depois de carregar, tudo funciona como hoje (motor, persistência e Desafios síncronos). O bundle de produção não contém nenhuma Peça, e os testes deixam de depender do Catálogo real.

## Escopo

**Inclui:**
- Mover os 9 JSON de `src/catalogo/dados/` para `public/dados/` (mesmo formato, um por Categoria + `meta.json`).
- `carregarCatalogo` assíncrono com erro tipado; carregador no `App` com telas de carregamento e de erro.
- Fixture congelada em `src/teste/` usada por Vitest e e2e; e2e interceptam `dados/*.json`.
- Testes de dados reais (`catalogo.test.ts`, `solucoes.test.ts`) passam a ler `public/dados/` via `node:fs`.
- Verificação de que o bundle (`dist/assets/*.js`) não contém IDs de Peças.
- Ajuste de caminhos em `README.md` e `docs/atualizar-catalogo.md`.

**Não inclui:**
- Busca assíncrona, debounce e cancelamento (Fase 10). `filtrarPecas` continua síncrono.
- Pipeline, OpenDB, Mercado Livre, aliases (Fases 11–13). `public/dados/` continua versionado até a Fase 13.
- Service Worker / cache offline (Fase 15).
- Desafios continuam no bundle (`src/desafios/dados/desafios.json`): são curados e não contêm IDs de Peças.

## Premissas

- URLs relativas: `${import.meta.env.BASE_URL}dados/<arquivo>.json` (`base: './'`), para funcionar no subcaminho do GitHub Pages e no preview.
- Sem memoização no módulo: "Tentar de novo" precisa refazer o fetch. O Catálogo carregado vive no estado do `App`.
- Os 9 arquivos são buscados em paralelo (`Promise.all`); a falha de qualquer um é falha do carregamento todo (sem Catálogo parcial).
- O link compartilhado (`#...`) continua na URL durante o carregamento e é aplicado por `iniciarApp` quando o Catálogo chega (o componente que chama `iniciarApp` só monta depois do carregamento).
- A fixture é um recorte das ~80 Peças reais que os testes citam por ID ou por termo de busca, na mesma ordem relativa do Catálogo, com os preços de hoje e `dataReferencia: "2026-10"`.

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Formato em `/dados/` | 9 arquivos como hoje | Entregável literal e `/dados/*.json` do ADR 0003 (escolha do usuário) |
| Contrato do carregamento | `Promise<ResultadoCarregamento>` (union `ok`), nunca rejeita | Segue o padrão `ResultadoValidacao` de `src/catalogo/validar.ts` |
| Injeção para testes | parâmetro opcional `{ buscar?: typeof fetch, signal?: AbortSignal }` | Testa sem `vi.stubGlobal`; o `AbortSignal` evita setState após desmontar (StrictMode) |
| Estrutura do App | `App` vira o carregador; o corpo atual vai para `Aplicacao({ catalogo })` | `useReducer(iniciarApp)` precisa do Catálogo de forma síncrona na montagem |
| Fixture | `src/teste/catalogo.json` (`{ dataReferencia, pecas }`) + `src/teste/catalogo.ts` | Uma fonte para Vitest e e2e; congelada, os dados reais mudam sem quebrar testes (escolha do usuário) |
| Respostas da fixture | helper `respostaDados(arquivo)` que fatia a fixture por Categoria (`meta.json` → `{ dataReferencia }`) | Mesmo formato do servidor real, sem duplicar 9 arquivos |
| e2e | `test` estendido em `e2e/ajudantes.ts` com fixture `auto` que faz `page.route('**/dados/*.json', …)` | Todos os specs passam a importar `test` de `./ajudantes`; ninguém esquece a interceptação |
| Testes de dados reais | `src/teste/dadosPublicados.ts` lê `public/dados/` com `node:fs` e valida | São testes dos dados, não do app (escolha do usuário); migram para o pipeline na Fase 13 |
| Bundle sem Peças | teste em `e2e/publicacao.spec.ts`: nenhum ID de `public/dados/` aparece em `dist/assets/*.js` | Segue o padrão existente de inspecionar `dist/` nesse spec; `dist/dados/` é ignorado de propósito |

## Contratos

```ts
// src/catalogo/carregar.ts
export const ARQUIVOS_DADOS = ['cpu', 'placa-mae', 'ram', 'gpu', 'armazenamento',
  'fonte', 'gabinete', 'cooler'] as const          // + 'meta'
export type ErroCarregamento =
  | { tipo: 'rede'; arquivo: string; mensagem: string }   // fetch rejeitou
  | { tipo: 'http'; arquivo: string; status: number }      // !res.ok
  | { tipo: 'json'; arquivo: string }                       // corpo não é JSON
  | { tipo: 'validacao'; erros: ErroCatalogo[] }            // validarCatalogo falhou
export type ResultadoCarregamento =
  | { ok: true; catalogo: Catalogo } | { ok: false; erro: ErroCarregamento }
export function carregarCatalogo(opcoes?: {
  buscar?: typeof fetch; base?: string; signal?: AbortSignal
}): Promise<ResultadoCarregamento>
export function mensagemErro(erro: ErroCarregamento): string  // texto pt-BR para a tela de erro
```

## Arquivos afetados

- `public/dados/*.json` (novo, movido com `git mv`) — os 9 JSON atuais.
- `src/catalogo/dados/` (removido).
- `src/catalogo/carregar.ts` (novo) — fetch, parse, junção na ordem das Categorias, `validarCatalogo`, erro tipado.
- `src/catalogo/index.ts` (alterado) — remove imports de JSON e a versão síncrona; reexporta `carregarCatalogo`, tipos de erro e de schema.
- `src/App.tsx` (alterado) — carregador: estados `carregando | erro | pronto`, effect com `AbortController`, `tentarDeNovo`.
- `src/Aplicacao.tsx` (novo) — corpo atual do `App`, recebendo `catalogo` por prop (inclui `Marca`, ou `Marca` vai para `src/componentes/Marca.tsx` para ser reusada nas telas de carregamento/erro).
- `src/componentes/TelaCarregamento.tsx` + `.css` (novo) — marca + `role="status"` "Carregando o Catálogo…".
- `src/componentes/TelaErroCatalogo.tsx` (novo) — `role="alert"`, mensagem, botão "Tentar de novo".
- `src/teste/catalogo.json`, `src/teste/catalogo.ts` (novos) — fixture, `catalogoFixture` validado e `respostaDados(arquivo)` / `buscarFixture: typeof fetch`.
- `src/teste/dadosPublicados.ts` (novo) — `lerCatalogoPublicado()` via `node:fs`.
- `src/motor/teste-pecas.ts` (alterado) — `peca(id)` busca em `catalogoFixture`.
- Testes que chamam `carregarCatalogo()` (alterados para `catalogoFixture`): `src/busca/filtrar.test.ts`, `src/componentes/IlustracaoPeca.test.tsx`, `src/componentes/PainelBusca.test.tsx`, `src/persistencia/iniciar.test.ts`, `src/persistencia/remontar.test.ts`.
- `src/catalogo/catalogo.test.ts`, `src/desafios/solucoes.test.ts` (alterados) — usam `lerCatalogoPublicado()`.
- `src/App.test.tsx` → `src/Aplicacao.test.tsx` (renomeado; renderiza `<Aplicacao catalogo={catalogoFixture} />`).
- `src/App.test.tsx` (novo) — carregamento, erro e "Tentar de novo".
- `src/catalogo/carregar.test.ts` (novo).
- `e2e/ajudantes.ts` (alterado) — preços vêm da fixture; exporta `test` estendido com a interceptação.
- `e2e/*.spec.ts` (alterados) — importam `test` de `./ajudantes`.
- `e2e/carregamento.spec.ts` (novo) — tela de carregamento e de erro.
- `e2e/publicacao.spec.ts` (alterado) — bundle sem IDs de Peças.
- `README.md`, `docs/atualizar-catalogo.md` (alterados) — novo caminho `public/dados/`; passo 7 passa a dizer que os testes de tela usam a fixture e só `catalogo.test.ts`/`solucoes.test.ts` leem os dados reais.
- `docs/roadmap-pc-builder-pro.md` (alterado no fim) — marcar entregáveis e status da Fase 9.

## Passos de implementação

1. **Fixture.** Gerar `src/teste/catalogo.json` com um script descartável (no scratchpad) que copia de `src/catalogo/dados/` as Peças cujos IDs aparecem nos testes/e2e, mais as que os termos de busca dos testes encontram, mantendo a ordem. Criar `src/teste/catalogo.ts` (`catalogoFixture` validado com `validarCatalogo`, `respostaDados`, `buscarFixture`).
2. **Migrar os testes de unidade/componente** para a fixture (`teste-pecas.ts` e os 5 testes que chamam `carregarCatalogo()`). Rodar `npm test`: tudo verde antes de mexer no app.
3. **Mover os dados** para `public/dados/` (`git mv`) e criar `src/teste/dadosPublicados.ts`; apontar `catalogo.test.ts` e `solucoes.test.ts` para ele.
4. **`carregarCatalogo` assíncrono** em `src/catalogo/carregar.ts` com os testes de `carregar.test.ts` (TDD, com `buscar` injetado); atualizar `src/catalogo/index.ts`.
5. **App.** Extrair `Aplicacao`; renomear `App.test.tsx` → `Aplicacao.test.tsx`; escrever o carregador `App` com `TelaCarregamento` e `TelaErroCatalogo` e o novo `App.test.tsx`.
6. **e2e.** `test` estendido em `ajudantes.ts`, preços da fixture, imports dos specs, `carregamento.spec.ts`, verificação do bundle em `publicacao.spec.ts`.
7. **Docs** (`README.md`, `docs/atualizar-catalogo.md`) e roadmap.
8. Rodar lint, typecheck, `test:coverage`, `build`, `test:e2e` e `lighthouse`; buscar no `dist/assets/` um ID como `cpu-ryzen-5-7600` para conferir à mão.

## Comportamentos a testar

`carregarCatalogo` (`src/catalogo/carregar.test.ts`):
- [ ] busca os 9 arquivos em `<base>dados/<arquivo>.json` (base padrão `import.meta.env.BASE_URL`)
- [ ] com respostas válidas, devolve `{ ok: true }` com as Peças na ordem das Categorias e a `dataReferencia` do `meta.json`
- [ ] repassa o `signal` para cada `fetch`
- [ ] fetch rejeitado → `{ ok: false, erro: { tipo: 'rede', arquivo } }`
- [ ] resposta 404/500 → `{ tipo: 'http', arquivo, status }`
- [ ] corpo que não é JSON → `{ tipo: 'json', arquivo }`
- [ ] Peça inválida ou ID duplicado → `{ tipo: 'validacao', erros }` com os caminhos de `validarCatalogo`
- [ ] nunca rejeita a Promise (todos os casos acima resolvem)
- [ ] `mensagemErro` produz texto pt-BR para cada tipo

Fixture e dados reais:
- [ ] `catalogoFixture` passa em `validarCatalogo` e contém todos os IDs usados por `peca(id)` nos testes
- [ ] `catalogo.test.ts` e `solucoes.test.ts` continuam verdes lendo `public/dados/`

Carregador (`src/App.test.tsx`, jsdom, `buscar` injetado ou `fetch` stub):
- [ ] enquanto o fetch não resolve, mostra "Carregando o Catálogo…" (`role="status"`) e não mostra a busca
- [ ] quando resolve, mostra a montagem com a busca e a Data de referência da fixture
- [ ] quando falha, mostra a tela de erro (`role="alert"`) com o botão "Tentar de novo"
- [ ] "Tentar de novo" refaz o fetch e, se der certo, mostra a montagem
- [ ] um link `#...` presente na URL antes do carregamento é aplicado quando o Catálogo chega
- [ ] desmontar durante o carregamento não gera aviso de setState (signal abortado)

`Aplicacao` (`src/Aplicacao.test.tsx`): os testes atuais do `App` continuam verdes sobre a fixture.

e2e:
- [ ] todos os specs atuais passam com `dados/*.json` interceptados pela fixture (desktop e celular)
- [ ] com a resposta de `dados/` atrasada, a tela de carregamento aparece antes da montagem
- [ ] com `dados/` abortado, aparece a tela de erro; liberando a rota e clicando "Tentar de novo", o app carrega
- [ ] a tela de erro e a de carregamento passam no axe
- [ ] nenhum ID de Peça de `public/dados/` aparece em `dist/assets/*.js`

**Framework e comando de testes:** Vitest (`npm test`, `npm run test:coverage`, ambiente `node` por padrão, `// @vitest-environment jsdom` nos de componente) e Playwright (`npm run test:e2e`, projetos `chromium` e `celular`); Lighthouse com `npm run lighthouse`.

## Mapeamento com o roadmap

| Entregável da fase | Passos / testes que o cobrem |
|---|---|
| JSON servidos em `/dados/` (provisoriamente em `public/dados/`) | passo 3; testes de dados reais |
| `carregarCatalogo` assíncrono com validação Zod e erro tipado | passo 4; testes de `carregar.test.ts` |
| Tela de carregamento e de erro com "Tentar de novo" | passo 5; testes do carregador e `carregamento.spec.ts` |
| Bundle sem nenhuma Peça | passos 3–4 (remoção dos imports); teste em `publicacao.spec.ts`; passo 8 |
| Testes com fixtures próprias em `src/teste/`; e2e interceptam `/dados/` | passos 1, 2 e 6 |

## Riscos e pontos de atenção

- **Termos de busca na fixture:** com menos Peças, o "primeiro resultado" de um termo pode mudar (para melhor ou pior). O recorte mantém a ordem relativa e inclui tudo que os termos casam hoje; conferir com a suíte do passo 2.
- **Testes que leem `public/dados/` via fs** usam `process.cwd()`; Vitest roda da raiz, então resolver o caminho a partir de `import.meta.url` para não depender disso.
- **Lighthouse** roda sobre `dist/` real (com `dist/dados/` copiado de `public/`); a tela de carregamento aparece por um instante e precisa passar no contraste.
- **StrictMode** monta o effect duas vezes em dev: o `AbortController` na limpeza evita fetch duplicado vencendo a corrida.
- **Cobertura:** o limite de 90% vale só para `src/motor/**`; `teste-pecas.ts` já está excluído.

## Critério de pronto

- Todos os comportamentos acima com teste passando; `npm run lint`, `typecheck`, `test:coverage`, `build`, `test:e2e` e `lighthouse` verdes.
- O app abre mostrando a tela de carregamento e funciona como antes; com `/dados/` fora do ar, aparece a tela de erro.
- `dist/assets/` não contém IDs de Peças; `src/catalogo/dados/` não existe mais.
- Roadmap com os entregáveis da Fase 9 marcados.
