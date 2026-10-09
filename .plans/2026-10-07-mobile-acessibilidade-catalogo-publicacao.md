---
titulo: Mobile, acessibilidade, Catálogo completo e publicação
data: 2026-10-07
status: em andamento
---

# Plano: Mobile, acessibilidade, Catálogo completo e publicação

**Origem:** `docs/roadmap-pc-builder-pro.md`, Fase 8: Mobile, acessibilidade, Catálogo completo e publicação

> **Andamento (2026-10-08): blocos A, B, C, D e E1 concluídos. Falta só o E2 (repositório no GitHub e Pages, só com confirmação do usuário).**
> - **D1:** Catálogo de 42 para 152 Peças (CPU 24, GPU 24, placa-mãe 22, RAM 18, armazenamento 18, fonte 16, gabinete 16, cooler 14), com novos testes em `catalogo.test.ts`: faixa de 140 a 160, mínimo de 12 por Categoria, cobertura de socket/RAM/form factor, IDs anteriores fixos, Índice 100 nas Peças de referência e ordem dos pares.
> - **D2:** `docs/pontuacao.md` com a tabela completa de Índices. Desafios recalibrados e soluções de referência refeitas.
> - **D3:** `docs/atualizar-catalogo.md`.
> - **Decisão do usuário (2026-10-08):** atualizar tudo para os preços de 2026-10. RAM e SSD subiram de 3 a 5 vezes, então os preços de RAM/SSD das Peças antigas foram corrigidos (sem mudar IDs) e quatro Orçamentos de Desafio subiram: Escritório 2.800 → 4.200, Gamer de entrada 4.000 → 5.000, Orçamento apertado 3.500 → 4.500, Refrigeração 4.500 → 5.000.
> - **Testes que liam o Catálogo real foram corrigidos de forma explícita:** `filtrar.test.ts` passou a verificar propriedades (ordem não crescente, limites de preço, empate na ordem do Catálogo) em vez de listas fixas; os subtotais de `build.test.ts` e `Bandeja.test.tsx` foram atualizados; os termos de busca ambíguos (`b760m`, `vengeance lpx`, `a400`, `sn850x`) ficaram mais específicos, e `vengeance 2x16` e `rtx 4060` usam o nome exato onde há um helper para isso. O Primeiro PC do App test e do e2e usa a nova solução de referência.
> - Suíte: 405 testes unitários e 47 e2e verdes (9 pulados por projeto); lint e typecheck verdes.
> - Desvios do plano: `e2e` e `lighthouse` rodam em paralelo depois de `verificar` (e `publicar` espera os dois). O teste de "deslizar rápido rola" verifica que o gesto não inicia arraste, que a alça tem `touch-action: manipulation` e que a lista rola, porque o Chromium headless não rola com toques sintéticos. Os Índices das Peças novas são estimativas por proporção, não medições.

## Objetivo

Deixar o PC Builder Pro pronto para usuários reais: usável no celular (busca em painel inferior, arraste por toque e tocar no Slot para escolher), acessível (Lighthouse ≥ 90, sem violações do axe), com cerca de 150 Peças reais e publicado no GitHub Pages a cada push na `main`.

## Escopo

**Inclui (em blocos, cada um pode ser um ciclo `/to-tdd`):**
- **A. Acessibilidade:** foco visível, contraste, rótulos, anúncios ao encaixar e ao bloquear; axe nos e2e e Lighthouse CI.
- **B. Mobile:** painel inferior de busca, TouchSensor com toque longo, botão "Escolher" em todo Slot vazio (todas as telas), e2e em viewport de celular.
- **C. Polimento visual** das ilustrações SVG e animações.
- **D. Catálogo** com ~150 Peças pesquisadas em lojas BR, guia `docs/atualizar-catalogo.md`, índices documentados em `docs/pontuacao.md`.
- **E. Publicação** no GitHub Pages por GitHub Actions, depois de lint, testes, e2e e Lighthouse.

**Não inclui:**
- Fotos reais, preços ao vivo, PWA/offline, domínio próprio.
- Novas regras de compatibilidade (comprimento de GPU, altura de cooler) — continuam fora do escopo do roadmap.

## Premissas

- O breakpoint mobile é o já existente: abaixo de `60rem` (o layout de 3 colunas começa em `min-width: 60rem` em `src/App.css`).
- Abaixo do breakpoint, a busca fica sempre montada dentro do painel inferior; recolher o painel só o desloca (transform), para que a alça arrastada não seja desmontada no meio do arraste.
- Ao começar um arraste que vem da busca no celular, o painel se recolhe para liberar a Bancada.
- "Anúncio ao encaixar" usa o `aviso` (`role="status"`) que já existe em `Montagem`: passa a ter texto também no encaixe bem-sucedido.
- `PointerSensor` é trocado por `MouseSensor` + `TouchSensor` (padrão recomendado pelo dnd-kit para não brigar com a rolagem). Os e2e atuais usam mouse e continuam valendo.
- Vite com `base: './'`: o app só usa hash, então caminhos relativos funcionam no subcaminho do GitHub Pages (`/pc-builder-pro/`) e no `preview` local sem mudar o `baseURL` do Playwright.
- A Data de referência continua `2026-10` (os preços serão pesquisados neste mês); o guia explica como atualizá-la.
- IDs das Peças atuais **não mudam** (links compartilhados e soluções dos Desafios dependem deles). Preços podem ser corrigidos.
- O repositório não tem remote. Criar o repositório no GitHub, dar push e ativar Pages ("Source: GitHub Actions") são ações externas: serão feitas pelo usuário ou só com confirmação explícita no momento.

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Hospedagem | GitHub Pages via `actions/deploy-pages` | Escolha do usuário; a CI já é GitHub Actions |
| Caminho base | `base: './'` no `vite.config.ts` | Funciona em qualquer subcaminho sem env por ambiente |
| Arraste por toque | `TouchSensor` `{ delay: 200, tolerance: 5 }` + `MouseSensor` `{ distance: 5 }` | Toque longo não conflita com a rolagem (escolha do usuário) |
| Detecção de tela pequena | Hook `useTelaPequena()` com `matchMedia('(max-width: 59.99rem)')`, `false` quando não há `matchMedia` | Testável em jsdom (mock), mesma régua do CSS |
| Escolher pelo Slot | Função pura `filtrosDoSlot(slot)` → `{ ...FILTROS_INICIAIS, categoria, soCompativeis: true }` | Lógica testável fora do React, reaproveita `FiltrosBusca` |
| Painel inferior | Componente `PainelInferior` não modal: barra com botão `aria-expanded`/`aria-controls`, Esc recolhe e devolve o foco | Não bloqueia a Bancada, que precisa ser alvo do arraste |
| Anúncio de bloqueio no arraste | `SlotBancada` põe `estado` em `data` do droppable; `anuncios.onDragEnd` diz "não pode ser encaixada em X" quando `bloqueado` | Hoje o leitor ouve "solta em X" mesmo quando é bloqueado |
| Verificação de a11y | `@axe-core/playwright` (tags wcag2a/wcag2aa) nos e2e + `@lhci/cli` com `categories:accessibility` ≥ 0.9 | Escolha do usuário |
| Pesquisa de preços | WebSearch em Kabum, Pichau e Terabyte; `medio` = preço típico à vista; `min ≈ 0,9 × medio`, `max ≈ 1,12 × medio` como nas Peças atuais | Escolha do usuário; mantém a convenção existente |
| Pipeline | `ci.yml` com jobs `verificar` → `e2e` → `lighthouse` → `publicar` (só em push na `main`) | Só publica o que passou em tudo |

## Arquivos afetados

**A. Acessibilidade**
- `src/index.css` (alterado) — regra global `:focus-visible` com `--foco`; ajuste de tokens que o axe apontar.
- `src/estado/build.ts` (alterado) — `encaixarPeca` avisa `"<nome> encaixada na Build"` (somado ao texto de Peças que foram para a Bandeja).
- `src/bancada/anuncios.ts` (alterado) — `onDragEnd`/`onDragOver` distinguem destino bloqueado.
- `src/componentes/SlotBancada.tsx` (alterado) — `estado` no `data` do droppable.
- `e2e/acessibilidade.spec.ts` (novo) — axe nas telas principais, desktop e celular.
- `lighthouserc.json` (novo), `package.json` (alterado: `@axe-core/playwright`, `@lhci/cli`, script `lighthouse`).

**B. Mobile**
- `src/componentes/useTelaPequena.ts` (novo) — hook de mídia.
- `src/componentes/PainelInferior.tsx` + `.css` (novos) — painel recolhível da busca abaixo do breakpoint; acima dele renderiza os filhos inline.
- `src/busca/filtrar.ts` (alterado) + `src/busca/index.ts` — `filtrosDoSlot(slot)`.
- `src/componentes/SlotBancada.tsx` / `Bancada.tsx` (alterados) — prop `onEscolher(slot)`; botão "Escolher Peça para <rótulo>" em Slot vazio (e no SATA, que aceita várias), desabilitado durante arraste.
- `src/componentes/Montagem.tsx` (alterado) — sensores Mouse+Touch; estado `painelAberto`; `onEscolher` aplica `filtrosDoSlot`, abre o painel (celular) ou leva o foco ao título da busca (desktop); recolhe o painel no início do arraste vindo da busca; fecha o painel depois de "Adicionar à Build" quando aberto por um Slot.
- `src/App.css`, `src/componentes/Bancada.css`, `CardPeca.css`, `AlcaArraste` CSS (alterados) — ordem Bancada → lateral no celular, `padding-bottom` para a barra, alvos de toque ≥ 44 px, `touch-action: manipulation` na alça, Bancada legível em 360 px.
- `playwright.config.ts` (alterado) — projeto `celular` (`devices['Pixel 7']`).
- `e2e/ajudantes.ts` (novo) — helpers comuns extraídos de `bancada.spec.ts` (`pesquisar`, `slot`, `brl`…) e `abrirBusca(page)`, no-op no desktop.
- `e2e/montar-build.spec.ts`, `persistencia.spec.ts`, `desafios.spec.ts` (alterados) — usam `abrirBusca` e rodam nos dois projetos; `bancada.spec.ts` fica só no desktop (`test.skip(isMobile)`).
- `e2e/celular.spec.ts` (novo) — tocar no Slot, montar Build pelo painel inferior, arraste por toque longo (via CDP `Input.dispatchTouchEvent`).

**C. Polimento visual**
- `src/componentes/IlustracaoPeca.tsx` (alterado) — mais detalhe por Categoria (pás no fan da GPU e da fonte, dissipador na RAM, VRM/chipset na placa, janela lateral no gabinete, aletas/radiador no cooler), mantendo `viewBox 0 0 100 100`, `data-categoria`, `data-tamanho`.
- `src/componentes/Bancada.tsx`/`.css` — fundo do gabinete com mais detalhe (baias, espaço da fonte); transições de estado do Slot (`compativel`/`bloqueado`/`sobre`) suaves; leve "tremida" no destino bloqueado ao soltar. Tudo sob `MotionConfig reducedMotion="user"` e `@media (prefers-reduced-motion)`.

**D. Catálogo**
- `src/catalogo/dados/*.json` (alterados) — de ~42 para ~150 Peças. Meta por Categoria: CPU 24, GPU 24, placa-mãe 22, RAM 18, armazenamento 18, fonte 16, gabinete 16, cooler 14.
- `src/catalogo/catalogo.test.ts` (alterado) — novas faixas de quantidade e testes de cobertura.
- `docs/pontuacao.md` (alterado) — tabela de Índices com as novas CPUs e GPUs.
- `docs/atualizar-catalogo.md` (novo) — guia.
- `e2e/*.spec.ts` (alterados se preciso) — termos de busca que continuem únicos com o Catálogo maior.

**E. Publicação**
- `vite.config.ts` (alterado) — `base: './'`.
- `.github/workflows/ci.yml` (alterado) — jobs `e2e` (instala Chromium), `lighthouse`, `publicar` (permissions `pages: write`, `id-token: write`, `concurrency: pages`).
- `README.md` (alterado) — link do app publicado e como rodar e2e/Lighthouse.
- `docs/roadmap-pc-builder-pro.md` (alterado no fim) — marcar entregáveis e status.

## Passos de implementação

1. **A1** Anúncios: encaixe bem-sucedido gera aviso; destino bloqueado no arraste gera anúncio próprio.
2. **A2** Foco visível global e revisão de rótulos (botões só com ícone, `×` do Slot, barra de Meta).
3. **A3** Instalar `@axe-core/playwright`, escrever `e2e/acessibilidade.spec.ts` (desktop primeiro) e corrigir violações (contraste de `--texto-suave`, selo "Incompatível", cores das ilustrações sobre o fundo, etc.).
4. **B1** `filtrosDoSlot` + botão "Escolher" no Slot vazio + integração em `Montagem` no desktop (filtra e foca a busca).
5. **B2** `useTelaPequena` + `PainelInferior`; layout de celular no CSS.
6. **B3** Sensores Mouse+Touch, recolher painel ao arrastar da busca, alvos de toque.
7. **B4** Projeto `celular` no Playwright, `e2e/ajudantes.ts`, adaptar specs existentes, `e2e/celular.spec.ts`; incluir as telas de celular no `acessibilidade.spec.ts`.
8. **C1** Polimento das ilustrações e animações (com testes de renderização por Categoria e checagem visual manual no navegador).
9. **D1** Pesquisar e adicionar Peças por Categoria, em lotes (uma Categoria por vez, `npm test` a cada lote). Prioridade: as mais vendidas no Brasil, cobrindo AM4/AM5/LGA1700/LGA1851, DDR4/DDR5, os três form factors e todas as faixas de preço.
10. **D2** Índices das novas CPUs/GPUs em `docs/pontuacao.md`; conferir `src/desafios/solucoes.test.ts` e os e2e (ajustar soluções ou termos se preços/novas Peças mudarem o resultado).
11. **D3** Escrever `docs/atualizar-catalogo.md`.
12. **E1** `base: './'`, `lighthouserc.json`, jobs `e2e`, `lighthouse` e `publicar` no `ci.yml`.
13. **E2** (com confirmação do usuário) criar o repositório no GitHub, adicionar o remote, push e ativar Pages; conferir o app publicado em celular e desktop e anotar a URL no README.
14. Atualizar o roadmap (entregáveis marcados, Fase 8 concluída).

## Comportamentos a testar

**A. Acessibilidade**
- [ ] `reduzirBuild` com `encaixar` bem-sucedido define aviso `info` "<nome> encaixada na Build"
- [ ] `encaixar` que desloca Peças avisa o encaixe e quantas Peças foram para a Bandeja na mesma mensagem
- [ ] `encaixar` bloqueado continua com aviso `erro` com a mensagem do bloqueio (regressão)
- [ ] `anuncios.onDragEnd` sobre destino com `estado: 'bloqueado'` diz "<Peça> não pode ser encaixada em <Slot>."
- [ ] `anuncios.onDragOver` sobre destino bloqueado menciona que é incompatível
- [ ] `SlotBancada` expõe o `estado` no `data` do droppable (via anúncio em teste de componente)
- [ ] e2e: axe sem violações wcag2a/wcag2aa na Build livre vazia, na Build com Peças, com Peça bloqueada visível, na tela de Desafios e na tela de conclusão

**B. Mobile**
- [ ] `filtrosDoSlot` de `dimm-2` devolve Categoria `ram`, `soCompativeis: true` e o resto igual a `FILTROS_INICIAIS`
- [ ] `filtrosDoSlot` de `sata` e de `m2-1` devolve Categoria `armazenamento`
- [ ] Slot vazio mostra o botão "Escolher Peça para <rótulo>"; Slot ocupado de uma Peça só não mostra; Slot SATA sempre mostra
- [ ] Clicar em "Escolher" chama `onEscolher` com o Slot; o botão fica desabilitado durante um arraste
- [ ] `useTelaPequena` devolve `false` sem `matchMedia` e reage à mudança da media query
- [ ] `PainelInferior` em tela grande renderiza os filhos sem barra
- [ ] `PainelInferior` em tela pequena começa recolhido, botão com `aria-expanded="false"`; tocar expande; Esc recolhe e devolve o foco ao botão
- [ ] `Montagem`: "Escolher" num Slot aplica a Categoria e "Só compatíveis" nos filtros da busca (desktop) e abre o painel (celular)
- [ ] `Montagem` (celular): "Adicionar à Build" com o painel aberto por um Slot recolhe o painel
- [ ] e2e celular: montar uma Build completa só tocando nos Slots e em "Adicionar à Build", com o Orçamento certo
- [ ] e2e celular: toque longo na alça e arraste até um Slot encaixa a Peça; deslizar rápido na lista rola sem iniciar arraste
- [ ] e2e: `montar-build`, `persistencia` e `desafios` passam nos projetos `chromium` e `celular`
- [ ] e2e celular: sem rolagem horizontal da página em 360 px (`scrollWidth <= clientWidth`)

**C. Polimento**
- [ ] `IlustracaoPeca` renderiza um SVG `aria-hidden` com `data-categoria` para cada Categoria e as variações de forma (cooler ar/water, M.2/2.5)
- [ ] Os e2e de arraste e encaixe continuam passando depois das animações novas

**D. Catálogo**
- [x] Catálogo real passa em `validarCatalogo` (regressão)
- [x] Total entre 140 e 160 Peças e pelo menos 12 por Categoria
- [x] Cada socket do schema tem pelo menos uma placa-mãe, uma CPU e um cooler compatíveis
- [x] Cada tipo de RAM tem placa-mãe e RAM; cada form factor tem placa-mãe e gabinete que o aceita
- [x] Toda CPU e GPU tem Índices, e os Índices respeitam a ordem esperada em pares de referência (ex.: 9800X3D > 7800X3D em Jogos; RTX 5090 > RTX 4060)
- [x] Os IDs que existiam antes da Fase 8 continuam no Catálogo (lista fixa no teste)
- [x] Cada Desafio continua com solução válida (`solucoes.test.ts`)

**E. Publicação**
- [ ] `npm run build` gera `dist/index.html` com caminhos de assets relativos (`./assets/...`)
- [ ] Lighthouse CI sobre `dist/` dá acessibilidade ≥ 0,9
- [ ] O link compartilhável funciona aberto sob subcaminho (e2e já cobre `location.pathname`; conferir no site publicado)

**Framework e comando de testes:** Vitest (`npm test`, cobertura `npm run test:coverage`), Playwright (`npm run test:e2e`, projetos `chromium` e `celular`), Lighthouse CI (`npm run lighthouse`).

## Mapeamento com o roadmap

| Entregável da fase | Passos / testes que o cobrem |
|---|---|
| Layout para celular: busca em painel inferior, arraste por toque e tocar no Slot | Passos 4–7; testes B |
| Revisão de acessibilidade: contraste, foco, rótulos, anúncios | Passos 1–3 e 7; testes A |
| Catálogo com ~150 Peças e Data de referência atualizada | Passos 9–10; testes D |
| Guia `docs/atualizar-catalogo.md` | Passo 11 |
| Polimento visual das ilustrações e animações | Passo 8; testes C |
| Deploy com publicação automática da `main` | Passos 12–13; testes E |
| Critério: publicado, e2e celular e desktop, Lighthouse a11y ≥ 90 | Passos 7, 12, 13; e2e nos dois projetos, job `lighthouse` |

## Riscos e pontos de atenção

- **Curadoria de 150 Peças** é o bloco mais longo: fazer em lotes por Categoria, conferindo specs que alimentam regras (socket, tipo de RAM, slots DIMM/M.2, form factor, consumo). Preços em lojas variam muito no dia; registrar a fonte no guia, não em cada Peça.
- **Catálogo maior quebra e2e e Desafios**: termos como `ryzen 7600` ou `rtx 4060` podem achar mais de uma Peça (`.first()` pega outra). Revisar os termos para que sejam únicos e rodar `solucoes.test.ts` a cada lote.
- **Toque longo no e2e**: o Playwright não tem gesto de arraste por toque; será feito com CDP (`Input.dispatchTouchEvent`), só no Chromium.
- **Alça arrastada dentro do painel recolhido**: o painel não pode desmontar a busca durante o arraste (só transform), senão o dnd-kit cancela.
- **Ações externas**: criar repositório público e publicar expõe o código e o app; só com confirmação do usuário.

## Critério de pronto

- Todos os comportamentos acima com teste passando; `npm run lint`, `typecheck`, `test:coverage` e `build` verdes.
- `npm run test:e2e` verde nos projetos `chromium` e `celular`, incluindo axe sem violações.
- Lighthouse CI com acessibilidade ≥ 0,9.
- App publicado no GitHub Pages pela CI a partir da `main`, URL no README e Fase 8 marcada como concluída no roadmap.
