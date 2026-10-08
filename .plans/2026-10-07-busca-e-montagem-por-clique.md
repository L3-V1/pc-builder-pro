---
titulo: Busca e montagem por clique com painel de Orçamento
data: 2026-10-07
status: aprovado
---

# Plano: Busca e montagem por clique com painel de Orçamento

**Origem:** `docs/roadmap-pc-builder-pro.md`, Fase 3: Busca e montagem por clique

## Objetivo

Primeira versão usável de ponta a ponta: o usuário pesquisa e filtra Peças, vê nos cards quais são incompatíveis com a Build atual, monta uma Build por clique e acompanha Orçamento, Checklist e Alertas. A lógica nova (busca, avaliação de Peça, estado da Build) fica em funções puras testadas no Vitest; os componentes têm testes com Testing Library; um teste Playwright monta uma Build completa e confere o Orçamento.

## Escopo

**Inclui:**
- Funções puras de busca: texto, Categoria, marca, faixa de preço, ordenação por preço, "só compatíveis".
- Avaliação de uma Peça contra a Build (bloqueada / livre / substitui / desloca), apoiada em `encaixar` e `pecasIncompativeisComPlaca` de `src/motor`.
- Estado da Build em `useReducer` (adicionar, remover, confirmar troca de placa).
- Componentes: painel de busca, card de Peça, painel da Build (com remover), painel de Orçamento, painel de Checklist + Alertas, diálogo de confirmação de troca de placa-mãe.
- Layout em duas colunas no desktop (busca | Build), empilhado em telas estreitas.
- Testes de componente (`@testing-library/react` + jsdom) e teste e2e (Playwright, local).

**Não inclui:**
- Bancada, arrastar e soltar, Bandeja (Fase 4). Peças deslocadas numa troca de placa simplesmente saem da Build após confirmação.
- Persistência, Meta, link (Fase 5); Pontuação (Fase 6).
- Layout mobile dedicado e revisão completa de acessibilidade (Fase 8) — mas sem quebrar em telas estreitas e com rótulos básicos.
- Playwright na CI (decisão: só local nesta fase).
- Regras novas no motor (ex.: cooler↔socket).

## Premissas

- **Texto da busca:** casa com `nome` + `marca`, sem diferenciar maiúsculas nem acentos; todos os termos precisam aparecer.
- **Filtro de marca:** multisseleção; nenhuma marcada = todas. As opções vêm das Peças da Categoria selecionada (ou de todas).
- **Faixa de preço do filtro:** mín e máx em R$ aplicados ao preço **médio**, inclusivos; campo vazio = sem limite.
- **Ordenação:** "Relevância" (ordem do Catálogo), "Menor preço", "Maior preço" — pelo médio, estável.
- **"Só compatíveis":** esconde apenas Peças bloqueadas. Placa-mãe nunca é bloqueada (ela desloca), então sempre aparece.
- **Peça única já encaixada** (mesmo ID): botão vira "Na Build" desabilitado. RAM e armazenamento podem ser adicionados de novo.
- **Substituição** de Categoria única (ex.: outra CPU): o botão diz "Trocar" e aplica direto, sem diálogo (a Peça antiga só sai da Build).
- **Placa-mãe que desloca Peças:** card avisa "Removerá N Peças da Build"; clicar abre diálogo listando-as; aplica só ao confirmar. Sem deslocamento, aplica direto.
- **Alertas:** lista de `verificarBuild(build)` (Bloqueantes não devem existir via UI, mas se aparecerem são listados também). Margem da fonte padrão.
- **Formatação:** `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`; Data de referência como "outubro de 2026" (reaproveita `formatarDataReferencia` de `App.tsx`).
- **CSS:** arquivos `.css` simples por componente importados no `.tsx`, sem biblioteca nova. Cores via variáveis em `:root` com `color-scheme: light dark`.
- Estado vive só em memória (recarregar zera); persistência é Fase 5.

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Organização | `src/busca/` (lógica pura de busca e avaliação), `src/estado/` (reducer), `src/componentes/` (React) | Mantém o padrão domínio puro × UI das Fases 1–2 |
| Estado | `useReducer` com reducer puro `reduzirBuild` | Testável em node; sem lib de estado para uma tela |
| Testes de componente | `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`; docblock `// @vitest-environment jsdom` por arquivo | Mantém `environment: 'node'` padrão do motor |
| Diálogo | Componente próprio `role="dialog"` `aria-modal`, foco no botão "Confirmar", Esc cancela | `<dialog>.showModal` tem suporte incompleto no jsdom |
| Botão bloqueado | `disabled` + `aria-describedby` apontando para as mensagens do motor no card | Decisão do usuário |
| E2E | `@playwright/test`, só Chromium, `webServer: npm run build && npm run preview`, pasta `e2e/` | Roda contra o build real; local por decisão do usuário |
| Valores esperados no e2e | Calculados importando os JSON do Catálogo no teste | Não quebra quando a Fase 8 mudar preços |

### Contratos novos

```ts
// src/busca/filtrar.ts
type Ordenacao = 'relevancia' | 'preco-asc' | 'preco-desc'
type FiltrosBusca = {
  texto: string
  categoria?: Categoria
  marcas: string[]             // vazio = todas
  precoMin?: number            // R$, sobre faixaPreco.medio
  precoMax?: number
  ordenacao: Ordenacao
  soCompativeis: boolean
}
const FILTROS_INICIAIS: FiltrosBusca
normalizarTexto(s: string): string                  // minúsculas, sem acentos
filtrarPecas(pecas: Peca[], build: Build, filtros: FiltrosBusca): Peca[]
marcasDisponiveis(pecas: Peca[], categoria?: Categoria): string[]   // ordenadas, sem repetição

// src/busca/avaliar.ts
type AvaliacaoPeca =
  | { tipo: 'bloqueada'; bloqueios: Incompatibilidade[] }
  | { tipo: 'na-build' }                                   // Peça única com mesmo ID já encaixada
  | { tipo: 'livre'; substitui?: Peca; desloca: Peca[] }   // desloca só é não vazio para placa-mãe
avaliarPeca(build: Build, peca: Peca): AvaliacaoPeca

// src/busca/specs.ts
specsPrincipais(peca: Peca): string[]   // ex.: CPU → ['AM5', '6 núcleos / 12 threads', 'Vídeo integrado', 'Cooler box']
ROTULOS_CATEGORIA: Record<Categoria, string>   // 'cpu' → 'CPU', 'placa-mae' → 'Placa-mãe', ...

// src/estado/build.ts
type EstadoBuild = { build: Build; trocaPendente?: { placa: PecaDe<'placa-mae'>; desloca: Peca[] } }
type AcaoBuild =
  | { tipo: 'adicionar'; peca: Peca }     // placa que desloca → vira trocaPendente; bloqueada → estado igual
  | { tipo: 'remover'; pecaId: string }
  | { tipo: 'confirmar-troca' }
  | { tipo: 'cancelar-troca' }
reduzirBuild(estado: EstadoBuild, acao: AcaoBuild): EstadoBuild
ESTADO_INICIAL: EstadoBuild

// src/componentes/formatar.ts
formatarReais(valor: number): string
formatarDataReferencia(aaaaMm: string): string   // movida de App.tsx
```

## Arquivos afetados

- `src/busca/filtrar.ts`, `avaliar.ts`, `specs.ts`, `index.ts` (novos) + `*.test.ts` — lógica pura.
- `src/estado/build.ts` (novo) + `build.test.ts` — reducer.
- `src/componentes/formatar.ts` (novo) + teste — formatação de R$ e data.
- `src/componentes/PainelBusca.tsx` (novo) — campo de texto, select de Categoria, checkboxes de marca, mín/máx, ordenação, "só compatíveis", contador de resultados e estado vazio ("Nenhuma Peça encontrada").
- `src/componentes/CardPeca.tsx` (novo) — nome, marca, Categoria, specs, Faixa de preço (médio em destaque + mín–máx), selo "Incompatível" com mensagens, aviso de deslocamento, botão "Adicionar à Build" / "Trocar" / "Na Build".
- `src/componentes/PainelBuild.tsx` (novo) — Peças encaixadas agrupadas por Categoria com botão "Remover"; estado vazio.
- `src/componentes/PainelOrcamento.tsx` (novo) — total médio, faixa mín–máx, "Preços de referência: <mês de ano>".
- `src/componentes/PainelChecklist.tsx` (novo) — Categorias faltando ou "Build completa", e lista de Alertas.
- `src/componentes/DialogoTrocaPlaca.tsx` (novo) — confirmação com lista das Peças que sairão.
- `src/componentes/*.css` (novos) — estilos por componente.
- `src/componentes/*.test.tsx` (novos) — testes de componente.
- `src/App.tsx` (alterado) — `useReducer(reduzirBuild)`, estado dos filtros, layout em duas colunas.
- `src/index.css` (alterado) — variáveis de cor, grid responsivo; remove `max-width: 40rem` do `main`.
- `src/teste/setup.ts` (novo) — `import '@testing-library/jest-dom/vitest'` e `cleanup` após cada teste.
- `vite.config.ts` (alterado) — `test.setupFiles`, `test.exclude` incluindo `e2e/**`.
- `playwright.config.ts` (novo) e `e2e/montar-build.spec.ts` (novo).
- `tsconfig.node.json` (alterado) — incluir `playwright.config.ts` e `e2e`.
- `package.json` (alterado) — devDeps de Testing Library, jsdom, `@playwright/test`; script `test:e2e`.
- `.gitignore` / `.prettierignore` (alterados) — `playwright-report`, `test-results`.
- `README.md` (alterado) — `npm run test:e2e` (+ `npx playwright install chromium`) e menção à Fase 3.
- `docs/roadmap-pc-builder-pro.md` (alterado, ao final) — marcar entregáveis e status da Fase 3.

## Passos de implementação

1. Instalar devDeps (Testing Library, jsdom, Playwright), `setupFiles`, `exclude` e `tsconfig.node.json`; garantir que `npm test` segue verde.
2. `src/componentes/formatar.ts` (mover `formatarDataReferencia`, criar `formatarReais`).
3. `src/busca/specs.ts` e `ROTULOS_CATEGORIA`.
4. `src/busca/avaliar.ts` sobre `encaixar` / `pecasIncompativeisComPlaca`.
5. `src/busca/filtrar.ts` (texto → Categoria → marca → preço → compatíveis → ordenação) e `marcasDisponiveis`.
6. `src/estado/build.ts` (reducer com troca pendente).
7. Componentes, um por vez com seus testes: `CardPeca`, `PainelOrcamento`, `PainelChecklist`, `PainelBuild`, `DialogoTrocaPlaca`, `PainelBusca`.
8. `App.tsx` + CSS: compor tudo, layout responsivo.
9. Playwright: config + `e2e/montar-build.spec.ts`.
10. `lint`, `typecheck`, `test:coverage`, `build`, `test:e2e`; atualizar README e roadmap.

## Comportamentos a testar

Formatação
- [ ] `formatarReais(1100)` → `R$ 1.100,00` (comparando sem depender do tipo de espaço).
- [ ] `formatarDataReferencia('2026-10')` → `outubro de 2026`.

Specs
- [ ] `specsPrincipais` de CPU traz socket, núcleos/threads e indica vídeo integrado e cooler box quando houver.
- [ ] Placa-mãe traz socket, tipo de RAM, form factor; RAM traz capacidade, tipo, pentes e frequência; GPU traz VRAM e consumo; fonte traz potência e certificação; gabinete traz form factors; armazenamento traz capacidade, formato e interface; cooler traz tipo.

Avaliação de Peça
- [ ] Build vazia: qualquer Peça é `livre`, sem `substitui` e `desloca` vazio.
- [ ] CPU de socket diferente da placa encaixada é `bloqueada` com o bloqueio `socket` do motor.
- [ ] CPU de mesmo socket com outra CPU encaixada é `livre` com `substitui` = CPU atual.
- [ ] Mesma CPU já encaixada é `na-build`; o mesmo kit de RAM continua `livre`.
- [ ] Placa LGA1700/DDR4 numa Build AM5/DDR5 é `livre` com `desloca` = CPU e RAM (e `substitui` = placa atual).
- [ ] Placa compatível com tudo é `livre` com `desloca` vazio.

Busca
- [ ] Filtros iniciais devolvem todo o Catálogo na ordem original.
- [ ] Texto casa nome e marca, ignora maiúsculas e acentos ("placa mae" não importa; "ryzen 7600" acha o Ryzen 5 7600; "corsair" acha RAM, fonte, gabinete e cooler).
- [ ] Texto sem resultado devolve lista vazia.
- [ ] Filtro de Categoria restringe à Categoria.
- [ ] Filtro de marcas aceita várias; vazio não filtra.
- [ ] `precoMin`/`precoMax` filtram pelo médio, inclusive nas bordas; ausentes não limitam.
- [ ] Ordenação por menor e maior preço médio; empate mantém ordem do Catálogo.
- [ ] "Só compatíveis" esconde CPUs de outro socket quando há placa-mãe e mantém todas as placas-mãe; sem placa não esconde nada.
- [ ] Filtros combinados (Categoria + marca + preço + ordenação) se aplicam juntos.
- [ ] `marcasDisponiveis` devolve marcas únicas e ordenadas, restritas à Categoria quando informada.

Estado da Build (reducer)
- [ ] `adicionar` Peça livre encaixa e a Build muda.
- [ ] `adicionar` Peça bloqueada devolve o mesmo estado.
- [ ] `adicionar` placa que desloca não muda a Build e cria `trocaPendente` com a placa e as Peças que sairiam.
- [ ] `confirmar-troca` aplica a placa, tira as deslocadas e limpa `trocaPendente`; `cancelar-troca` só limpa.
- [ ] `adicionar` placa sem deslocamento aplica direto.
- [ ] `remover` tira a Peça pelo ID.

Componentes (jsdom)
- [ ] `CardPeca` mostra nome, marca, specs, preço médio e faixa mín–máx formatados.
- [ ] Peça bloqueada: selo "Incompatível", mensagem do motor visível e botão desabilitado ligado à mensagem por `aria-describedby`.
- [ ] Peça livre: clicar "Adicionar à Build" chama `onAdicionar` com a Peça; substituição mostra "Trocar"; `na-build` mostra "Na Build" desabilitado.
- [ ] Placa que desloca mostra "Removerá N Peças da Build".
- [ ] `PainelOrcamento` mostra R$ 0,00 sem Peças, total médio e faixa mín–máx com Peças, e a Data de referência.
- [ ] `PainelChecklist` lista as Categorias faltando com rótulos em pt-BR, mostra "Build completa" quando completa, e lista os Alertas (ex.: fonte fraca) ou "Nenhum alerta".
- [ ] `PainelBuild` mostra estado vazio e, com Peças, um botão "Remover" por Peça que chama `onRemover` com o ID.
- [ ] `DialogoTrocaPlaca` lista as Peças que sairão; "Confirmar" e "Cancelar" chamam os callbacks; Esc cancela.
- [ ] `PainelBusca` repassa mudanças de texto, Categoria, marca, preço, ordenação e "só compatíveis" via `onMudarFiltros`.
- [ ] `App` (integração): adicionar uma CPU pela busca faz ela aparecer na Build e atualiza o Orçamento.

E2E (Playwright, `e2e/montar-build.spec.ts`)
- [ ] Montar por busca e clique: Ryzen 5 7600, B650M Aorus Elite, Corsair 32 GB DDR5, NVMe 1 TB, RTX 4060, CX650, NZXT H5 Flow → Checklist "Build completa", nenhum Alerta, Orçamento médio e faixa iguais à soma calculada dos JSON do Catálogo.
- [ ] Com "só compatíveis" ligado, o Core i5 12400 some da lista de CPUs; desligado, aparece com botão desabilitado e mensagem de socket.
- [ ] Clicar na B760M DS3H DDR4 abre o diálogo listando CPU e RAM; cancelar mantém a Build; confirmar remove-as e o Orçamento diminui.

**Framework e comando de testes:** Vitest (node por padrão; `// @vitest-environment jsdom` nos `.test.tsx`), `npm test` / `npm run test:coverage`; Playwright com `npm run test:e2e` (requer `npx playwright install chromium` uma vez).

## Mapeamento com o roadmap

| Entregável da fase | Passos / testes que o cobrem |
|---|---|
| Painel de busca com texto, filtros, ordenação e "só compatíveis" | Passos 5, 7 · testes "Busca", `PainelBusca` |
| Card de Peça com specs, Faixa de preço e incompatibilidade | Passos 3, 4, 7 · testes "Specs", "Avaliação", `CardPeca` |
| Botão "adicionar à Build" com mensagem de bloqueio | Passos 4, 6, 7 · `CardPeca` bloqueada, reducer, e2e 2 |
| Painel de Orçamento com médio, mín–máx e Data de referência | Passos 2, 7 · "Formatação", `PainelOrcamento` |
| Painel de Checklist e lista de Alertas | Passo 7 · `PainelChecklist` |
| Teste e2e montando Build completa e conferindo o Orçamento | Passo 9 · e2e 1 (e 2–3 como extras) |

## Riscos e pontos de atenção

- `Intl` usa espaço não separável em `R$ 1.100,00`; testes devem normalizar espaços ou usar regex.
- A cobertura com limiar de 90% hoje só inclui `src/motor/**`; manter assim (não incluir componentes) para não travar a CI por UI.
- `react/only-export-components` do oxlint: manter helpers (`formatar.ts`, rótulos) fora dos arquivos de componente.
- O e2e localiza Peças pelo nome visível; renomear Peças na Fase 8 exige ajustar o spec.
- O card da placa-mãe precisa calcular `pecasIncompativeisComPlaca` para cada placa a cada render; com ~40 Peças é irrelevante, revisar com 150 na Fase 8 (memoizar por Build se preciso).
- A Fase 4 vai trocar "deslocadas somem" por "deslocadas vão para a Bandeja": o reducer e o diálogo devem ficar fáceis de estender (as Peças deslocadas já ficam em `trocaPendente.desloca`).

## Critério de pronto

- Todos os comportamentos acima com teste passando; `npm test`, `npm run test:coverage`, `npm run lint`, `npm run typecheck` e `npm run build` verdes.
- `npm run test:e2e` passando localmente.
- Dá para montar pela interface uma Build completa e compatível com Orçamento correto (critério de conclusão da Fase 3).
- Entregáveis e status da Fase 3 marcados no roadmap; README atualizado.
