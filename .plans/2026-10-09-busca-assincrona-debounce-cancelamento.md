---
titulo: Busca assíncrona com debounce e cancelamento
data: 2026-10-09
status: aprovado
---

# Plano: Busca assíncrona com debounce e cancelamento

**Origem:** `docs/roadmap-pc-builder-pro.md`, Fase 10: Busca assíncrona

## Objetivo

A pesquisa de Peças da Montagem deixa de chamar `filtrarPecas` direto no render e passa por uma porta assíncrona `buscarPecas(filtros, signal)`, com debounce de 250 ms no texto, cancelamento da busca anterior e descarte de respostas fora de ordem. A interface mostra "Buscando…" e distingue "nenhum resultado" de "ainda buscando". A implementação fica sobre o Catálogo em memória e pode ser trocada (Web Worker, índice, remoto) sem mexer na UI.

## Escopo

**Inclui:**
- Porta `BuscarPecas` + implementação local `criarBuscaLocal(pecas)` reaproveitando a lógica de `filtrarPecas`.
- Hook `useBuscaPecas` (debounce, `AbortController`, descarte de respostas antigas, estado `buscando`).
- Montagem usando o hook; lista anterior esmaecida e inerte enquanto busca; contagem "Buscando…".
- Ajuste dos testes de componente (`Aplicacao.test.tsx`) e dos ajudantes e2e para esperar a busca assentar.

**Não inclui:**
- Trocar a implementação (Worker, índice invertido, API). Só a porta fica pronta.
- Peças fora de venda (Fase 14), pipeline (Fases 11–13), offline (Fase 15).
- Debounce em selects/checkboxes ou nos campos de preço.

## Premissas

- A Fase 9 está concluída no working tree atual (ainda não commitada); a Fase 10 é construída por cima dela na mesma branch.
- O debounce só vale quando a mudança é apenas no `texto` (como diz o roadmap). Categoria, marca, preço, ordenação e "escolher pelo Slot" disparam a busca imediatamente (ainda assíncrona e cancelável).
- A implementação local nunca falha; mesmo assim o hook trata rejeição que não seja `AbortError` como `erro`, e a Montagem mostra `EstadoVazio` com ícone `alerta` ("Não foi possível buscar"). Sem botão de nova tentativa: a próxima mudança de filtro já tenta de novo.
- `marcasDisponiveis` continua síncrono sobre `catalogo.pecas` (é dado do Catálogo, não resultado de busca).
- A primeira busca (filtros iniciais) roda sem atraso; até ela responder, `buscando` é `true` e a lista mostra "Buscando…" (sem resultados anteriores para esmaecer).

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| "Só compatíveis" | Fora da porta; aplicado síncrono na Montagem sobre o resultado | Escolha do usuário. A porta não conhece a Build; encaixar Peça não dispara nova busca; filtrar depois de ordenar preserva a ordem |
| Filtros da porta | `FiltrosPesquisa = Omit<FiltrosBusca, 'soCompativeis'>` | Contrato mínimo para qualquer implementação futura |
| Reuso de `filtrarPecas` | Extrair `pesquisarPecas(pecas, filtros)` (texto, Categoria, marca, preço, ordenação) e `soCompativeis(build, pecas)`; `filtrarPecas` vira a composição das duas, mesma assinatura | Testes atuais de `filtrar.test.ts` seguem valendo; a porta reaproveita a lógica sem Build fictícia |
| Implementação local | `criarBuscaLocal(pecas): BuscarPecas` resolve num microtask; se `signal.aborted`, rejeita com `DOMException('…', 'AbortError')` | Mantém a semântica assíncrona real e testável |
| Estado "buscando" | Derivado no render: `buscando = chaveDaResposta !== chave(filtrosPesquisa)` (chave = `JSON.stringify` dos filtros da porta) | Fica `true` no mesmo render da tecla, sem esperar efeito; evita clique em lista desatualizada |
| Fora de ordem | Cada efeito cria seu `AbortController` e aborta o anterior na limpeza; a resposta só é aplicada se o `signal` não foi abortado | Padrão já usado em `src/App.tsx` (carregar Catálogo) |
| Debounce | `setTimeout(atraso)` dentro do efeito, limpo na limpeza; atraso 250 ms se só o texto mudou em relação aos filtros da última execução, 0 caso contrário. Parâmetro `{ atraso = 250 }` no hook | Uma única busca por pausa; atraso configurável só para testes do hook |
| Lista durante a busca | Resultados anteriores ficam com `aria-busy="true"`, `inert` e classe `app__resultados--buscando` (opacidade reduzida); contagem mostra "Buscando…" | Escolha do usuário: sem piscar; `inert` impede clicar/arrastar Peça desatualizada sem mexer no `CardPeca` |
| Local do hook | `src/componentes/useBuscaPecas.ts` | Mesmo lugar de `useTelaPequena.ts` |

## Contratos

```ts
// src/busca/buscar.ts
export type FiltrosPesquisa = Omit<FiltrosBusca, 'soCompativeis'>
export type BuscarPecas = (filtros: FiltrosPesquisa, signal: AbortSignal) => Promise<Peca[]>
export function criarBuscaLocal(pecas: Peca[]): BuscarPecas

// src/busca/filtrar.ts
export function pesquisarPecas(pecas: Peca[], filtros: FiltrosPesquisa): Peca[]
export function soCompativeis(build: Build, pecas: Peca[]): Peca[]
export function filtrarPecas(pecas, build, filtros) // inalterada por fora

// src/componentes/useBuscaPecas.ts
export type EstadoBusca = { pecas: Peca[]; buscando: boolean; erro: boolean }
export function useBuscaPecas(
  buscar: BuscarPecas, filtros: FiltrosPesquisa, opcoes?: { atraso?: number },
): EstadoBusca
```

## Arquivos afetados

- `src/busca/filtrar.ts` (alterado): extrai `pesquisarPecas` e `soCompativeis`; `filtrarPecas` compõe as duas.
- `src/busca/buscar.ts` (novo): tipos da porta e `criarBuscaLocal`.
- `src/busca/index.ts` (alterado): exporta os novos símbolos e tipos.
- `src/busca/buscar.test.ts` (novo): testes da implementação local.
- `src/busca/filtrar.test.ts` (alterado): casos de `pesquisarPecas`/`soCompativeis` se não cobertos pelos atuais.
- `src/componentes/useBuscaPecas.ts` (novo) e `useBuscaPecas.test.ts` (novo, `renderHook` + `vi.useFakeTimers`).
- `src/componentes/Montagem.tsx` (alterado): `useMemo(() => criarBuscaLocal(catalogo.pecas))`, `useBuscaPecas`, `soCompativeis` local, contagem/estado vazio/erro, wrapper dos resultados com `aria-busy` e `inert`.
- `src/App.css` (alterado): `.app__resultados--buscando` (opacidade, transição respeitando `prefers-reduced-motion`).
- `src/Aplicacao.test.tsx` (alterado): ajudantes `adicionar`/`adicionarPorNome` e o teste de estado vazio passam a esperar a busca assentar (`await waitFor(() => expect(contagem).not.toHaveTextContent('Buscando'))` via um ajudante `esperarBusca()`).
- `e2e/ajudantes.ts` (alterado): `pesquisar` espera `[aria-busy="true"]` sumir depois do `fill`.
- `docs/roadmap-pc-builder-pro.md` (alterado): marca entregáveis e status da Fase 10.

## Passos de implementação

1. Em `filtrar.ts`, extrair `pesquisarPecas` e `soCompativeis` e reescrever `filtrarPecas` como `soCompativeis` aplicado (se ligado) sobre `pesquisarPecas`. Rodar `filtrar.test.ts` (deve seguir verde).
2. Criar `busca/buscar.ts` com `FiltrosPesquisa`, `BuscarPecas` e `criarBuscaLocal`; exportar em `busca/index.ts`.
3. Criar `useBuscaPecas`: chave dos filtros, efeito com `AbortController` + `setTimeout`, `useRef` com os filtros da última execução para decidir o atraso, estado `{ chave, pecas, erro }` da última resposta, `buscando` derivado.
4. Integrar na `Montagem`: separar `soCompativeis` do resto dos filtros, chamar o hook, aplicar `soCompativeis(build, pecas)` quando ligado, renderizar contagem ("Buscando…" / "N Peças encontradas"), `EstadoVazio` "Nenhuma Peça encontrada" só quando `!buscando && resultados.length === 0`, "Buscando Peças…" quando buscando sem lista anterior, erro com ícone `alerta`.
5. Envolver a lista num contêiner sempre presente com `aria-busy={buscando}` e `inert={buscando}`; CSS de esmaecimento.
6. Ajustar `Aplicacao.test.tsx` e `e2e/ajudantes.ts` para esperar a busca; rodar suíte de unidade e e2e.
7. Atualizar o roadmap.

## Comportamentos a testar

**Porta local (`buscar.test.ts`, `filtrar.test.ts`)**
- [ ] `pesquisarPecas` aplica texto, Categoria, marca, preço e ordenação sem depender de Build.
- [ ] `soCompativeis` remove só as Peças bloqueadas pela Build e preserva a ordem.
- [ ] `filtrarPecas` continua devolvendo o mesmo que antes (testes existentes verdes).
- [ ] `criarBuscaLocal` resolve com o mesmo resultado de `pesquisarPecas` para os mesmos filtros.
- [ ] `criarBuscaLocal` com `signal` já abortado rejeita com `AbortError`.

**Hook (`useBuscaPecas.test.ts`, timers falsos, porta espiã)**
- [ ] Na montagem, chama a porta uma vez sem esperar o debounce; `buscando` é `true` até resolver e `false` depois, com as Peças da resposta.
- [ ] Digitar "r", "rt", "rtx", …, "rtx 4060" em menos de 250 ms entre teclas dispara uma única chamada, com texto "rtx 4060", só depois de 250 ms de pausa.
- [ ] `buscando` fica `true` no mesmo render em que o texto muda (antes do debounce vencer).
- [ ] Mudar Categoria (ou ordenação, marca, preço) chama a porta sem esperar 250 ms.
- [ ] Ao disparar uma nova busca, o `signal` da anterior fica abortado.
- [ ] Resposta antiga que chega depois da mais recente (porta controlada com promessas manuais resolvidas fora de ordem) não sobrescreve o resultado da mais recente.
- [ ] Rejeição com `AbortError` é ignorada (sem `erro`); outra rejeição põe `erro: true` e `buscando: false`.
- [ ] Desmontar durante uma busca aborta o `signal` e não gera atualização de estado.

**Montagem/Aplicação (`Aplicacao.test.tsx`)**
- [ ] Logo após digitar, a contagem mostra "Buscando…" e a lista anterior fica com `aria-busy="true"`; depois mostra "N Peças encontradas".
- [ ] "Nenhuma Peça encontrada" só aparece depois que a busca assenta, nunca durante "Buscando…".
- [ ] Com "Só compatíveis" ligado, encaixar uma placa-mãe atualiza a lista sem nova chamada à porta (Peças de socket incompatível somem).
- [ ] Testes existentes de montagem por clique, Desafios e Bandeja seguem verdes com os ajudantes que esperam a busca.

**E2E**
- [ ] `e2e/montar-build.spec.ts` e demais specs continuam verdes com `pesquisar` esperando `aria-busy` sumir.

**Framework e comando de testes:** Vitest (`npm test`, ou `npx vitest run src/componentes/useBuscaPecas.test.ts`), Playwright (`npm run test:e2e`), mais `npm run lint` e `npm run typecheck`.

## Mapeamento com o roadmap

| Entregável da fase | Passos / testes que o cobrem |
|---|---|
| Porta `buscarPecas(filtros, signal)` sobre o Catálogo em memória, reaproveitando `filtrarPecas` | Passos 1–2; testes da porta local |
| Hook com debounce ~250 ms, `AbortController` e descarte fora de ordem | Passo 3; testes do hook (única chamada, abort, fora de ordem, desmontagem) |
| Indicador "buscando" e estado vazio que distingue os dois casos | Passos 4–5; testes da Montagem |
| Testes com timers falsos: digitação rápida = uma busca; cancelada não sobrescreve | Testes do hook "rtx 4060" e "fora de ordem" |

## Riscos e pontos de atenção

- **Clique em lista desatualizada:** testes e e2e que digitam e clicam logo no primeiro card podem pegar a Peça errada. Mitigado por `inert` durante a busca e pelos ajudantes que esperam `aria-busy` sumir; revisar todos os usos de `pesquisar`/`adicionar` nos e2e (`celular.spec.ts`, `acessibilidade.spec.ts`, `desafios.spec.ts`).
- **`inert` e foco:** se o foco estiver num botão da lista quando ela fica inerte, o foco se perde. Na prática o foco está no campo de busca; o caso "escolher pelo Slot" foca o título da busca.
- **Região `aria-live`:** a contagem alterna "Buscando…" ↔ resultado a cada pausa; com `polite` isso é aceitável, mas conferir no teste de acessibilidade (axe) e no Lighthouse.
- **Timers falsos + React:** usar `act(() => vi.advanceTimersByTimeAsync(...))` para resolver microtasks junto com timers.
- **Duração dos testes de componente:** cada digitação passa a esperar ~250 ms reais em `Aplicacao.test.tsx`; aceitável, mas se ficar lento demais, considerar expor o atraso.

## Critério de pronto

- Todos os comportamentos acima com teste passando; `npm test`, `npm run lint`, `npm run typecheck` e `npm run test:e2e` verdes.
- Critério da fase: digitar "rtx 4060" dispara uma única busca após a pausa (teste do hook), os testes de corrida passam e o e2e de montar uma Build continua verde.
- Roadmap atualizado com a Fase 10 concluída.
