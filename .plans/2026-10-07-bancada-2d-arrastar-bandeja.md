---
titulo: Bancada 2D com arrastar e soltar e Bandeja
data: 2026-10-07
status: aprovado
---

# Plano: Bancada 2D com arrastar e soltar e Bandeja

**Origem:** `docs/roadmap-pc-builder-pro.md`, Fase 4: Bancada 2D

## Objetivo

Trocar a lista do `PainelBuild` por uma Bancada em SVG com Slots físicos (socket, DIMM, PCIe, M.2, SATA, cooler, fonte, gabinete e placa-mãe). As Peças são arrastadas da busca ou da Bandeja para os Slots com mouse ou teclado, e os Slots acendem em verde ou vermelho durante o arraste. A Bandeja guarda as Peças candidatas e tudo o que sai da Build (substituição, troca de placa-mãe, desencaixe), com subtotal próprio fora do Orçamento. Nada some sem o usuário querer.

## Escopo

**Inclui:**
- Modelo puro de Slots derivado da Build (`src/bancada/`) e estado de cada Slot durante o arraste.
- Reducer ampliado: Bandeja, encaixar com Peças desalojadas indo para a Bandeja, desencaixar, descartar e aviso para `aria-live`.
- Fim do `DialogoTrocaPlaca`: a troca de placa-mãe é aplicada na hora e as Peças incompatíveis vão para a Bandeja.
- Ilustração SVG genérica por Categoria, com variações de tamanho e cor.
- dnd-kit (sensor de ponteiro e de teclado, `DragOverlay`, anúncios em pt-BR) e Framer Motion (`motion`) para encaixe e remoção.
- Card de Peça com alça de arraste, "Adicionar à Build" e "Para a Bandeja".
- Atualização dos testes de componente e do e2e da Fase 3, mais e2e novo de arraste, teclado e troca de placa-mãe.

**Não inclui:**
- Persistência da Bandeja e da Build (Fase 5), Pontuação (Fase 6).
- Arraste por toque e layout de celular dedicado (Fase 8). Telas estreitas só empilham as colunas.
- Ilustrações refinadas (Fase 8). Aqui são formas simples.
- Regras novas no motor (ex.: cooler↔socket, limite de portas SATA, comprimento de GPU).
- Multi-GPU: apenas um Slot PCIe x16 é desenhado.

## Decisões confirmadas com o usuário

- Troca de placa-mãe **sem diálogo**: aplica na hora, as deslocadas vão para a Bandeja e um aviso aparece.
- Substituição de Categoria única: a Peça anterior **vai para a Bandeja**.
- A Bancada **substitui o PainelBuild**. O card mantém "Adicionar à Build" e ganha "Para a Bandeja".
- **Um Slot por posição física.**
- Sem placa-mãe, adicionar CPU, cooler, RAM, GPU ou armazenamento (por clique ou arraste para a Bandeja) **manda a Peça para a Bandeja** com o aviso "Encaixe uma placa-mãe primeiro". A Build só contém o que aparece em Slots.
- Desencaixar (botão no Slot ou arrastar até a Bandeja) **manda para a Bandeja**. Desencaixar a placa-mãe leva junto CPU, cooler, RAM, GPU e armazenamento.

## Premissas

- **Slots sempre visíveis:** gabinete, fonte e placa-mãe. **Com placa-mãe:** socket da CPU, cooler (sobre o socket), `slotsDimm` slots DIMM, `slotsM2` slots M.2, um PCIe x16 (se `slotsPcieX16 > 0`) e uma zona SATA que aceita vários discos 2.5 (o motor não limita SATA).
- **RAM:** cada kit ocupa `modulos` DIMMs consecutivos, na ordem de `build.ram`. Soltar um kit em qualquer DIMM adiciona o kit, e a posição é sempre a próxima livre. O mesmo vale para M.2.
- **Estado do Slot durante o arraste:** `neutro` (outra Categoria, ou a mesma Peça já encaixada), `compativel` (`avaliarPeca` livre, inclusive substituição) ou `bloqueado` (`avaliarPeca` bloqueada). Slots de outra Categoria ficam esmaecidos e não aceitam a soltura.
- **Soltar num Slot bloqueado:** não encaixa. A Peça volta pela animação do `DragOverlay` e o aviso mostra as mensagens do motor.
- **Bandeja:** lista que aceita repetições (dois kits iguais, por exemplo). Cada item tem uma `chave` estável gerada por contador no estado. Ao encaixar a partir da Bandeja, o item sai dela; ao encaixar a partir da busca, a Bandeja não muda. Cada item tem "Descartar". O subtotal é a soma dos preços médios, exibida como "fora do Orçamento".
- **Origens e destinos do arraste:** busca → Slot, busca → Bandeja, Bandeja → Slot e Slot → Bandeja. Slot → Slot e Bandeja → Bandeja não fazem nada.
- **Teclado:** a alça é um botão "Arrastar {nome}". Espaço pega e solta, as setas pulam entre os destinos habilitados (coordinate getter próprio que salta para o centro do próximo droppable) e Esc cancela. Anúncios e instruções do dnd-kit em pt-BR.
- **Variações visuais (função pura):** cor derivada da marca por hash numa paleta fixa. Tamanho: placa-mãe e gabinete pelo form factor; GPU pelo `consumoW` (≤120 curta, ≤220 média, >220 longa); fonte pela `potenciaW`. Forma: cooler a ar ou water, armazenamento M.2 ou 2.5.
- **Animação:** `AnimatePresence` no ocupante de cada Slot (entra com mola, sai com fade e deslocamento) e `layout` nos itens da Bandeja. `<MotionConfig reducedMotion="user">` respeita a preferência do sistema.
- **Layout desktop (≥ 60rem):** três colunas, busca | Bancada | lateral (Orçamento, Checklist e Alertas, Bandeja), com `max-width` subindo para ~96rem. Abaixo disso, as colunas empilham.

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Biblioteca de arraste | `@dnd-kit/core` (6.x, `DndContext`, `useDraggable`, `useDroppable`, `DragOverlay`) | Prevista no roadmap e na ADR 0002; tem sensor de teclado |
| Animação | pacote `motion` (`motion/react`), sucessor do `framer-motion` | Mesma API, nome atual do Framer Motion |
| Lógica fora do React | `src/bancada/slots.ts`, `estadoSlot.ts`, `arraste.ts`, `visual.ts`, todas puras | Testáveis em node, seguindo o padrão dos módulos `motor` e `busca` |
| Tradução arraste → ação | `acaoDoArraste(origem, destino): AcaoBuild \| undefined` | `onDragEnd` fica trivial e a regra fica testada em node |
| Estado | `src/estado/build.ts` ampliado (mesmo `useReducer`) | Um único reducer para Build, Bandeja e aviso |
| Diálogo de troca | Removido (`DialogoTrocaPlaca.*`) | A Bandeja torna a troca reversível |
| IDs dnd | Draggable `busca:<pecaId>`, `bandeja:<chave>`, `slot:<slotId>`; droppable `slot:<slotId>` e `bandeja`; `data` carrega `{ peca, origem }` | Distingue origens com Peças repetidas |
| E2E de arraste | Helper `arrastar(page, origem, destino)` com `page.mouse` e `steps` | O PointerSensor tem distância de ativação |

### Contratos novos e alterados

```ts
// src/bancada/slots.ts
export type SlotId =
  | 'gabinete' | 'fonte' | 'placa-mae' | 'cpu' | 'cooler' | 'gpu' | 'sata'
  | `dimm-${number}` | `m2-${number}`
export type Slot = { id: SlotId; categoria: Categoria; rotulo: string; ocupantes: Peca[] }
export const CATEGORIAS_DA_PLACA: readonly Categoria[]   // cpu, cooler, ram, gpu, armazenamento
export function slotsDaBancada(build: Build): Slot[]
export function precisaDePlaca(peca: Peca): boolean

// src/bancada/estadoSlot.ts
export type EstadoSlot = 'neutro' | 'compativel' | 'bloqueado'
export function estadoDoSlot(build: Build, slot: Slot, peca: Peca): EstadoSlot

// src/bancada/arraste.ts
export type OrigemArraste =
  | { tipo: 'busca' } | { tipo: 'bandeja'; chave: string } | { tipo: 'slot'; slotId: SlotId }
export type DestinoArraste = { tipo: 'slot'; slot: Slot } | { tipo: 'bandeja' }
export function acaoDoArraste(peca: Peca, origem: OrigemArraste, destino?: DestinoArraste): AcaoBuild | undefined

// src/bancada/visual.ts
export type VariacaoVisual = { cor: string; tamanho: 'p' | 'm' | 'g'; forma?: string }
export function variacaoVisual(peca: Peca): VariacaoVisual

// src/estado/build.ts
export type ItemBandeja = { chave: string; peca: Peca }
export type EstadoBuild = {
  build: Build
  bandeja: ItemBandeja[]
  proximaChave: number
  aviso?: { id: number; texto: string; tom: 'info' | 'erro' }
}
export type AcaoBuild =
  | { tipo: 'encaixar'; peca: Peca; daBandeja?: string }
  | { tipo: 'guardar'; peca: Peca }
  | { tipo: 'desencaixar'; pecaId: string }
  | { tipo: 'descartar'; chave: string }
export function subtotalBandeja(bandeja: ItemBandeja[]): number
```

## Arquivos afetados

- `package.json` (alterado): `@dnd-kit/core`, `motion`.
- `src/bancada/slots.ts`, `estadoSlot.ts`, `arraste.ts`, `visual.ts`, `index.ts` (novos), cada um com o seu `.test.ts`.
- `src/bancada/teclado.ts` (novo): coordinate getter que pula entre droppables.
- `src/bancada/anuncios.ts` (novo): `announcements` e `screenReaderInstructions` em pt-BR.
- `src/estado/build.ts` e `build.test.ts` (alterados): Bandeja, novas ações, fim de `trocaPendente`, `confirmar-troca` e `cancelar-troca`.
- `src/componentes/IlustracaoPeca.tsx` (novo): SVG por Categoria usando `variacaoVisual`.
- `src/componentes/Bancada.tsx`, `.css` e `.test.tsx` (novos): gabinete aberto em SVG com os Slots posicionados.
- `src/componentes/SlotBancada.tsx` (novo): droppable com classes de estado, ocupante draggable, botão "Remover {nome}" e `AnimatePresence`.
- `src/componentes/Bandeja.tsx`, `.css` e `.test.tsx` (novos): droppable, itens draggable, "Descartar" e subtotal (`data-testid="bandeja-subtotal"`).
- `src/componentes/CardPeca.tsx`, `.css` e `.test.tsx` (alterados): alça "Arrastar {nome}" e botão "Para a Bandeja" (`onGuardar`).
- `src/App.tsx`, `App.css` e `App.test.tsx` (alterados): `DndContext` com sensores, `DragOverlay`, `MotionConfig`, região `role="status"` com o aviso e layout em três colunas.
- `src/componentes/PainelBuild.*` e `DialogoTrocaPlaca.*` (removidos).
- `e2e/montar-build.spec.ts` (alterado): placa-mãe adicionada primeiro, e o teste do diálogo vira "troca manda para a Bandeja".
- `e2e/bancada.spec.ts` (novo): Build completa só arrastando, teclado, troca de placa-mãe e Bandeja.
- `docs/roadmap-pc-builder-pro.md` (alterado no fim): marcar os entregáveis e o status.

## Passos de implementação

1. Instalar `@dnd-kit/core` e `motion`.
2. `slots.ts`: `precisaDePlaca` e `slotsDaBancada`, com ocupação de DIMM por `modulos` e de M.2 e SATA por formato.
3. `estadoSlot.ts` sobre `avaliarPeca`.
4. Reducer: `encaixar` (sem placa vai para a Bandeja, bloqueio gera aviso de erro, desalojadas vão para a Bandeja, item `daBandeja` sai da Bandeja), `guardar`, `desencaixar` (placa leva as dependentes), `descartar` e `subtotalBandeja`.
5. `arraste.ts`: `acaoDoArraste`.
6. `visual.ts` e `IlustracaoPeca.tsx`.
7. `Bandeja.tsx` e `SlotBancada.tsx`/`Bancada.tsx`, primeiro sem dnd, renderizando a partir do estado.
8. `CardPeca`: "Para a Bandeja" e alça de arraste.
9. `App.tsx`: trocar PainelBuild e diálogo por Bancada e Bandeja; ligar `DndContext` (PointerSensor com `distance: 5` e KeyboardSensor com `teclado.ts`), `onDragStart` guarda a Peça ativa para pintar os Slots, `onDragEnd` chama `acaoDoArraste` e despacha; `DragOverlay` com `IlustracaoPeca`; anúncios em pt-BR.
10. Animações com `motion` e `MotionConfig`.
11. Remover PainelBuild e DialogoTrocaPlaca e ajustar CSS e layout.
12. Ajustar e2e da Fase 3 e escrever `e2e/bancada.spec.ts`.
13. Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:coverage` e `npm run test:e2e`, e atualizar o roadmap.

## Comportamentos a testar

**Slots (`slots.test.ts`)**
- [ ] Build vazia tem apenas os Slots gabinete, fonte e placa-mãe, vazios.
- [ ] Com placa-mãe aparecem cpu, cooler, `slotsDimm` DIMMs, `slotsM2` M.2, gpu e sata.
- [ ] Placa com `slotsPcieX16 = 0` não tem Slot gpu.
- [ ] Um kit de 2 módulos ocupa `dimm-1` e `dimm-2`, e o segundo kit começa em `dimm-3`.
- [ ] Armazenamento M.2 ocupa `m2-1`, `m2-2`... e o 2.5 vai para a zona `sata`.
- [ ] `precisaDePlaca` é verdadeiro para cpu, cooler, ram, gpu e armazenamento, e falso para gabinete, fonte e placa-mãe.

**Estado do Slot (`estadoSlot.test.ts`)**
- [ ] Slot de outra Categoria fica `neutro`.
- [ ] CPU AM5 sobre o socket de placa AM5 fica `compativel`, e CPU LGA1700 fica `bloqueado`.
- [ ] RAM DDR4 sobre DIMM de placa DDR5 fica `bloqueado`, e um kit que excede os DIMMs livres também.
- [ ] Gabinete que não aceita o form factor fica `bloqueado`.
- [ ] Outra CPU compatível sobre um socket ocupado fica `compativel` (substituição), e a mesma CPU fica `neutro`.

**Reducer (`estado/build.test.ts`)**
- [ ] `guardar` adiciona à Bandeja com chave nova e aceita Peças repetidas com chaves diferentes.
- [ ] `descartar` remove só o item daquela chave.
- [ ] `encaixar` de uma Peça livre a coloca na Build sem mexer na Bandeja.
- [ ] `encaixar` de uma CPU sem placa-mãe a manda para a Bandeja, com aviso "Encaixe uma placa-mãe primeiro".
- [ ] `encaixar` com `daBandeja` sem placa-mãe só gera aviso e não duplica o item.
- [ ] `encaixar` de uma Peça bloqueada não muda Build nem Bandeja e gera aviso de erro com a mensagem do motor.
- [ ] `encaixar` com `daBandeja` tira o item da Bandeja.
- [ ] Substituir a CPU manda a CPU antiga para a Bandeja.
- [ ] Trocar placa AM5/DDR5 por LGA1700/DDR4 aplica na hora, manda placa antiga, CPU e RAM para a Bandeja e avisa quantas foram.
- [ ] `desencaixar` de uma Peça a manda para a Bandeja.
- [ ] `desencaixar` da placa-mãe manda placa, CPU, cooler, RAM, GPU e armazenamento para a Bandeja, e gabinete e fonte ficam.
- [ ] `subtotalBandeja` soma os preços médios e retorna 0 para Bandeja vazia.

**Arraste (`arraste.test.ts`)**
- [ ] Busca → Slot vira `encaixar`, e busca → Bandeja vira `guardar`.
- [ ] Bandeja → Slot vira `encaixar` com `daBandeja`.
- [ ] Slot → Bandeja vira `desencaixar`.
- [ ] Sem destino, Bandeja → Bandeja e Slot → Slot retornam `undefined`.
- [ ] Soltar num Slot de outra Categoria retorna `undefined`.

**Visual (`visual.test.ts`)**
- [ ] A mesma marca sempre gera a mesma cor, e a cor está na paleta.
- [ ] Placa ATX é `g`, Micro-ATX `m` e Mini-ITX `p`.
- [ ] GPU com 115 W é `p` e com 285 W é `g`.

**Componentes (jsdom)**
- [ ] `Bancada` vazia mostra os Slots de gabinete, fonte e placa-mãe, sem socket e sem DIMM.
- [ ] `Bancada` com placa mostra os DIMMs rotulados "Slot DIMM 1..N" e a Peça encaixada no Slot.
- [ ] O botão "Remover {nome}" no Slot chama `onDesencaixar` com o ID.
- [ ] `Bandeja` vazia mostra o estado vazio, e com itens lista os nomes e o subtotal com "fora do Orçamento".
- [ ] "Descartar" na Bandeja chama `onDescartar` com a chave.
- [ ] `CardPeca` "Para a Bandeja" chama `onGuardar`, e a alça "Arrastar {nome}" existe.
- [ ] `App`: adicionar CPU sem placa a coloca na Bandeja, com o aviso em `role="status"` e o Orçamento em R$ 0,00.
- [ ] `App`: placa e depois CPU por clique mostram a CPU no socket e o Orçamento atualizado.
- [ ] `App`: trocar para placa DDR4 manda CPU e RAM para a Bandeja, sem diálogo.

**E2E (Playwright)**
- [ ] Fase 3 ajustado: Build completa por clique (placa primeiro) com o Orçamento correto.
- [ ] Monta uma Build completa só arrastando da busca para os Slots, com "Build completa" e Orçamento correto.
- [ ] Durante o arraste de uma CPU LGA1700 com placa AM5, o socket recebe a classe/atributo de bloqueado, e soltar não encaixa e mostra o aviso.
- [ ] Arrastar da busca para a Bandeja e da Bandeja para o Slot move a Peça e atualiza o subtotal.
- [ ] Trocar a placa-mãe por arraste manda as incompatíveis para a Bandeja, com Orçamento e subtotal da Bandeja corretos.
- [ ] Teclado: focar "Arrastar {nome}", Espaço, setas até o Slot e Espaço encaixam a Peça.

**Framework e comando de testes:** Vitest + Testing Library (`npm test`; componentes com `// @vitest-environment jsdom`) e Playwright (`npm run test:e2e`).

## Mapeamento com o roadmap

| Entregável da fase | Passos / testes que o cobrem |
|---|---|
| Bancada SVG, Slots da placa só com placa e gabinete/fonte a qualquer momento | Passos 2, 7; testes de Slots e de `Bancada` |
| Ilustração SVG por Categoria com variações | Passo 6; testes de Visual |
| Arrastar e soltar com Slots acendendo e Bloqueantes em vermelho | Passos 3, 5, 9; testes de Estado do Slot, Arraste e e2e de bloqueio |
| Animação de encaixe e remoção | Passo 10 (verificação visual manual e sem quebra nos e2e) |
| Bandeja com Peças da busca, da troca de placa-mãe e subtotal próprio | Passos 4, 7; testes do Reducer, de `Bandeja` e e2e da Bandeja e da troca |
| Arrastar com teclado | Passo 9 (`teclado.ts`, anúncios); e2e de teclado |
| E2E do arraste e da troca de placa-mãe | Passo 12; bloco E2E |

## Riscos e pontos de atenção

- **Teclado com dnd-kit:** o coordinate getter padrão anda em pixels e torna o e2e frágil. O getter próprio que salta entre droppables resolve, mas precisa ignorar Slots desabilitados.
- **Arraste no Playwright:** é preciso `page.mouse` com `steps` por causa da distância de ativação. Evitar `dragTo` puro.
- **jsdom não mede layout:** o arraste não é testado em componente, só no e2e. A regra fica nas funções puras.
- **Animações e e2e:** `AnimatePresence` mantém o elemento durante a saída. Os e2e devem usar `expect(...).toHaveCount(0)` com espera automática, nunca leitura imediata.
- **SVG versus tempo:** formas simples (retângulos e círculos) agora, com refinamento na Fase 8.
- A Fase 5 vai persistir a Bandeja. O formato `ItemBandeja` já é serializável (só tem IDs e Peças).

## Critério de pronto

- Todos os comportamentos acima com teste passando: `npm test`, cobertura do motor ≥ 90% e `npm run test:e2e` verdes.
- `npm run lint` e `npm run typecheck` sem erros.
- Critério da fase atendido: dá para montar uma Build completa só arrastando no desktop, e a troca de placa-mãe manda as Peças incompatíveis para a Bandeja.
- Roadmap com os entregáveis da Fase 4 marcados.
