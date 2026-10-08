---
titulo: Pontuação de desempenho por Perfil
data: 2026-10-07
status: aprovado
---

# Plano: Pontuação de desempenho por Perfil

**Origem:** `docs/roadmap-pc-builder-pro.md`, Fase 6: Pontuação por Perfil

## Objetivo

Mostrar o desempenho estimado da Build nos Perfis **Jogos** e **Produtividade**. A Pontuação sai dos Índices de desempenho das CPUs e GPUs do Catálogo e cai quando há Gargalos (CPU fraca para a GPU, pouca RAM). O painel explica cada penalidade, e a busca ganha ordenação por desempenho. A fórmula fica documentada e as constantes ficam num só lugar, para recalibrar depois. A Fase 7 vai usar `calcularPontuacao` para a "Pontuação mínima por Perfil".

## Escopo

**Inclui:**
- Índices `{ jogos, produtividade }` de 0 a 100 no schema e nos JSONs de CPU e GPU, mais o índice do vídeo integrado nas CPUs que o têm.
- `src/motor/pontuacao.ts`: cálculo puro da Pontuação por Perfil e lista de Gargalos.
- `docs/pontuacao.md`: escala, fontes de benchmark, fórmula, constantes e como recalibrar.
- `PainelPontuacao` na coluna lateral, com os dois Perfis lado a lado.
- Duas opções novas no "Ordenar por": "Desempenho em Jogos" e "Desempenho em Produtividade".
- Testes de unidade (Builds de referência), de componente e uma verificação no e2e existente.

**Não inclui:**
- Desafios e Pontuação mínima por Perfil (Fase 7).
- FPS por jogo (fora do escopo do produto).
- Influência de frequência de RAM, armazenamento ou cooler na Pontuação.
- Índices nas outras Categorias e mudanças no link ou no localStorage (a Pontuação é derivada, não é salva).

## Decisões confirmadas com o usuário

- **Escala:** 0 a 100. O 100 é uma referência fixa de topo de mercado, documentada (ex.: a CPU de jogos mais rápida e a GPU de consumo mais forte na Data de referência). Por isso uma Peça do Catálogo pode ficar bem abaixo de 100.
- **Fórmula:** média ponderada seguida de penalidades multiplicativas de Gargalo.
  - Jogos = 0,3 × CPU + 0,7 × GPU
  - Produtividade = 0,7 × CPU + 0,3 × GPU
- **Build parcial:** sem CPU não há Pontuação. Sem GPU, usa `indiceVideoIntegrado` da CPU quando ela tem vídeo integrado; sem vídeo integrado, o Perfil fica pendente ("Encaixe uma GPU"). Sem RAM, aplica o Gargalo de RAM.
- **UI:** os dois Perfis aparecem juntos no painel, e há duas opções de ordenação na busca. Não existe seletor global de Perfil.

## Premissas

- **Schema:**
  - CPU: `indices: { jogos, produtividade }` e `indiceVideoIntegrado?: { jogos, produtividade }`. Um `refine` exige `indiceVideoIntegrado` quando, e somente quando, `videoIntegrado` é `true`.
  - GPU: `indices: { jogos, produtividade }`.
  - Cada índice é um inteiro de 0 a 100.
- **Gargalo de CPU:** vale só no Perfil Jogos, quando `gpu.jogos − cpu.jogos > 20` (`LIMITE_GARGALO_CPU`). A penalidade é de 1 ponto percentual por ponto acima do limite, com teto de 30% (`TETO_GARGALO_CPU`). Não se aplica quando a GPU é o vídeo integrado.
- **Gargalo de RAM:** a capacidade é a soma de `capacidadeTotalGB` dos kits da Build. O mínimo é 16 GB em Jogos e 32 GB em Produtividade (`RAM_MINIMA_GB`).
  - Sem RAM: −50%.
  - Abaixo da metade do mínimo: −30%.
  - Abaixo do mínimo: −15%.
- **Composição:** as penalidades se multiplicam, `base × Π(1 − p)`. O resultado é arredondado para inteiro e limitado a 0–100. Cada Gargalo guarda o percentual aplicado e os pontos perdidos, para o painel explicar.
- **Ordenação por desempenho:** decrescente pelo índice do Perfil. Peças sem índice (as outras Categorias) vão para o fim, na ordem original (ordenação estável). Na ordenação, a CPU usa `indices`, não o vídeo integrado.
- **Valores dos índices:** calibrados à mão a partir de fontes públicas (ex.: média de jogos em 1080p do TechPowerUp ou Tom's Hardware para CPUs; "relative performance" do TechPowerUp para GPUs; Cinebench R23 multi e Blender para Produtividade). As fontes e a data ficam em `docs/pontuacao.md`.
- **Testes de cálculo** usam Peças de fixture com índices controlados. Assim, recalibrar o Catálogo não quebra os testes de fórmula. Um teste à parte confere a coerência do Catálogo real.

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Onde fica o cálculo | `src/motor/pontuacao.ts`, exportado em `motor/index.ts` | É regra de domínio pura, entra na cobertura ≥ 90% do motor e a Fase 7 vai reutilizar |
| Formato dos índices | Objeto `{ jogos, produtividade }` com o tipo `Perfil = 'jogos' \| 'produtividade'` | Indexa direto por Perfil no cálculo, na ordenação e no painel |
| Vídeo integrado | Campo opcional na CPU com `refine` | Mantém o Catálogo coerente: não fica CPU com vídeo sem índice, nem índice sem vídeo |
| Constantes | `PESOS`, `LIMITE_GARGALO_CPU`, `TETO_GARGALO_CPU`, `RAM_MINIMA_GB` e penalidades de RAM exportadas de `pontuacao.ts` | Recalibrar exige mexer num só lugar, citado no documento |
| Resultado por Perfil | União discriminada `calculada` / `pendente` | O painel mostra o motivo ("Encaixe uma CPU" ou "Encaixe uma GPU") sem lógica própria |

### Contratos novos e alterados

```ts
// src/catalogo/schema.ts (alterado)
export const PERFIS = ['jogos', 'produtividade'] as const
export type Perfil = (typeof PERFIS)[number]
const Indices = z.strictObject({ jogos: indice, produtividade: indice }) // indice = int 0..100
// Cpu: + indices: Indices, indiceVideoIntegrado: Indices.optional()  (+ refine com videoIntegrado)
// Gpu: + indices: Indices

// src/motor/pontuacao.ts (novo)
export type Gargalo = {
  tipo: 'cpu' | 'ram'
  perfil: Perfil
  penalidade: number      // fração aplicada, ex.: 0.15
  pontosPerdidos: number  // inteiro
  mensagem: string        // pt-BR, ex.: "A CPU limita a GPU em jogos: −12%."
}
export type PontuacaoPerfil =
  | { tipo: 'calculada'; valor: number; base: number; usaVideoIntegrado: boolean; gargalos: Gargalo[] }
  | { tipo: 'pendente'; motivo: 'sem-cpu' | 'sem-gpu' }
export function calcularPontuacao(build: Build): Record<Perfil, PontuacaoPerfil>
export function indiceDaPeca(peca: Peca, perfil: Perfil): number | undefined // usada na busca

// src/busca/filtrar.ts (alterado)
export type Ordenacao = 'relevancia' | 'preco-asc' | 'preco-desc' | 'desempenho-jogos' | 'desempenho-produtividade'
```

## Arquivos afetados

- `src/catalogo/schema.ts` (alterado): `PERFIS`, `Perfil`, `Indices`, campos em `Cpu` e `Gpu`, e o `refine` do vídeo integrado. Reexportar `Perfil` em `src/catalogo/index.ts`.
- `src/catalogo/dados/cpu.json` e `gpu.json` (alterados): índices de todas as Peças.
- `src/catalogo/schema.test.ts`, `validar.test.ts` (alterados): fixtures inline de CPU e GPU ganham índices, e entram casos novos do schema. `catalogo.test.ts` (alterado): teste de coerência dos índices.
- `src/motor/pontuacao.ts` e `pontuacao.test.ts` (novos), mais o export em `src/motor/index.ts`.
- `src/busca/filtrar.ts` e `filtrar.test.ts` (alterados): ordenação por desempenho.
- `src/busca/specs.ts` e `specs.test.ts` (alterados): o card de CPU e GPU mostra "Jogos 62 · Produtividade 48".
- `src/componentes/PainelBusca.tsx` e `PainelBusca.test.tsx` (alterados): duas `<option>` novas.
- `src/componentes/PainelPontuacao.tsx`, `PainelPontuacao.css` e `PainelPontuacao.test.tsx` (novos).
- `src/App.tsx` e `App.test.tsx` (alterados): `PainelPontuacao` na lateral, logo depois de `BotaoCompartilhar` e antes de `PainelChecklist`.
- `e2e/montar-build.spec.ts` (alterado): depois de montar a Build completa, a Pontuação de Jogos aparece com valor.
- `docs/pontuacao.md` (novo): escala, referências de 100, fontes por Peça, fórmula, constantes, exemplos e como recalibrar.
- `GLOSSARY.md`: sem mudança, porque os termos já existem.
- `docs/roadmap-pc-builder-pro.md` (alterado no fim): marcar os entregáveis e o status.

## Passos de implementação

1. Schema: `Perfil`, `Indices`, campos novos e `refine`. Ajustar as fixtures dos testes do schema e do validador.
2. Catálogo: levantar e preencher os índices das 6 CPUs e 5 GPUs, com `indiceVideoIntegrado` nas CPUs com vídeo. Ao mesmo tempo, escrever a seção de fontes de `docs/pontuacao.md`.
3. `motor/pontuacao.ts`: pesos e base por Perfil, resolução da GPU (dedicada, vídeo integrado ou pendente), Gargalo de CPU, Gargalo de RAM, composição e mensagens.
4. `indiceDaPeca` e ordenação por desempenho em `filtrarPecas`. Opções novas no `PainelBusca`.
5. `specsPrincipais` com os índices de CPU e GPU.
6. `PainelPontuacao`: para cada Perfil, um título, o valor "62/100" com `role="meter"` (mesmo padrão do `PainelMeta`), a nota "Usando o vídeo integrado" quando for o caso, a lista de Gargalos ou "Sem Gargalos", e o texto pendente.
7. Ligar o painel em `App` e estender o e2e.
8. Completar `docs/pontuacao.md` (fórmula, constantes e um exemplo calculado de ponta a ponta). Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:coverage` e `npm run test:e2e`, e atualizar o roadmap.

## Comportamentos a testar

**Schema (`schema.test.ts`)**
- [ ] CPU e GPU sem `indices` são rejeitadas, e índices fora de 0–100 ou decimais também.
- [ ] CPU com `videoIntegrado: true` sem `indiceVideoIntegrado` é rejeitada, e a CPU com `videoIntegrado: false` que tem `indiceVideoIntegrado` também.

**Catálogo real (`catalogo.test.ts`)**
- [ ] Toda CPU e GPU do Catálogo tem índices válidos (já coberto pelo `validarCatalogo`).
- [ ] Coerência: em Jogos, o Ryzen 7 7800X3D supera o Ryzen 5 5600 e a RTX 4070 Super supera a RTX 3050. Em Produtividade, o Core i7-14700K supera o Ryzen 5 7600. O vídeo integrado de qualquer CPU fica abaixo da GPU mais fraca em Jogos.

**Pontuação (`pontuacao.test.ts`, com fixtures)**
- [ ] Build vazia ou sem CPU: os dois Perfis ficam `pendente` com `sem-cpu`.
- [ ] CPU sem vídeo integrado e sem GPU: os dois Perfis ficam `pendente` com `sem-gpu`.
- [ ] CPU com vídeo integrado e sem GPU: calcula com `indiceVideoIntegrado`, `usaVideoIntegrado: true` e sem Gargalo de CPU.
- [ ] **Build equilibrada** (CPU 60/60, GPU 65/50, 32 GB): Jogos = round(0,3·60 + 0,7·65) = 64 e Produtividade = round(0,7·60 + 0,3·50) = 57, sem Gargalos.
- [ ] **Gargalo de CPU** (CPU 40 em Jogos, GPU 80): a diferença de 40 dá penalidade de 20%, o Gargalo aparece com a mensagem e os pontos perdidos, e o Perfil Produtividade não recebe esse Gargalo.
- [ ] Diferença exatamente no limite (20) não gera Gargalo, e uma diferença enorme fica no teto de 30%.
- [ ] **Pouca RAM** (8 GB): Jogos −30% (menos da metade de 16) e Produtividade −30%. Com 16 GB, Jogos fica sem Gargalo e Produtividade −15%. Sem RAM, −50% nos dois.
- [ ] A capacidade de RAM soma vários kits (2 × 16 GB = 32 GB, sem Gargalo em Produtividade).
- [ ] Gargalos de CPU e RAM juntos se multiplicam: `base × 0,8 × 0,85`, arredondado.
- [ ] O valor fica sempre entre 0 e 100 e é inteiro.
- [ ] `indiceDaPeca` devolve `indices[perfil]` para CPU e GPU e `undefined` para as outras Categorias.

**Busca (`filtrar.test.ts`, `specs.test.ts`)**
- [ ] `desempenho-jogos` ordena CPUs e GPUs pelo índice de Jogos, em ordem decrescente, e põe as outras Categorias no fim, na ordem original.
- [ ] `desempenho-produtividade` usa o índice de Produtividade, e uma ordem diferente da de Jogos prova isso.
- [ ] Ordenar por desempenho junto com o filtro de Categoria GPU devolve só GPUs, ordenadas.
- [ ] `specsPrincipais` de CPU e GPU inclui "Jogos N · Produtividade M".

**Componentes (jsdom)**
- [ ] `PainelPontuacao` com a Build vazia mostra "Encaixe uma CPU para ver a Pontuação" e nenhum `meter`.
- [ ] Com CPU sem vídeo integrado e sem GPU, mostra "Encaixe uma GPU".
- [ ] Com uma Build calculada, mostra os dois Perfis com "N/100" e um `meter` com `aria-valuenow`, além de "Sem Gargalos".
- [ ] Com Gargalos, lista cada mensagem com a penalidade, no Perfil certo.
- [ ] Com o vídeo integrado, mostra a nota "Usando o vídeo integrado".
- [ ] `PainelBusca` oferece as opções "Desempenho em Jogos" e "Desempenho em Produtividade" e chama `onMudarFiltros` com a ordenação certa.
- [ ] `App`: depois de encaixar placa, CPU, RAM e GPU pela interface, o painel de Pontuação mostra os valores dos dois Perfis.

**E2E (`e2e/montar-build.spec.ts`)**
- [ ] Depois de montar a Build completa, a região "Pontuação" mostra um valor de Jogos e um de Produtividade.

**Framework e comando de testes:** Vitest + Testing Library (`npm test`; componentes com `// @vitest-environment jsdom`; cobertura do motor com `npm run test:coverage`, mínimo de 90%) e Playwright (`npm run test:e2e`).

## Mapeamento com o roadmap

| Entregável da fase | Passos / testes que o cobrem |
|---|---|
| Índices por Perfil no schema, nas CPUs e GPUs, com fontes documentadas | Passos 1, 2, 8; testes de Schema e Catálogo real; `docs/pontuacao.md` |
| Cálculo da Pontuação com penalidade por Gargalo | Passo 3; bloco Pontuação |
| Painel de Pontuação que explica os Gargalos | Passos 6, 7; testes de `PainelPontuacao`, `App` e e2e |
| Ordenação da busca pelo Índice de desempenho | Passos 4, 5; testes de Busca e `PainelBusca` |
| Testes com Builds de referência (equilibrada, gargalo de CPU, pouca RAM) | Bloco Pontuação (três cenários nomeados) |

## Riscos e pontos de atenção

- **Calibração subjetiva:** as escalas de CPU e GPU só são comparáveis para o Gargalo de CPU porque as duas usam "100 = topo de mercado". Isso fica explícito no documento. Com o Catálogo atual (sem GPU topo de linha), talvez nenhuma Build real gere Gargalo de CPU. Os testes usam fixtures, e a Fase 8 (150 Peças) vai exercitar mais casos.
- **Mudança de schema quebra fixtures inline** nos testes do Catálogo. O passo 1 já prevê isso.
- **Mensagens com "−" e "%"** precisam seguir a regra de microcopy do projeto, sem travessão de ênfase.
- **Fase 7** vai comparar `valor` com a Pontuação mínima. Um Perfil `pendente` deve contar como não cumprido, e isso fica anotado no documento.

## Critério de pronto

- Todos os comportamentos acima com teste passando. `npm test`, `npm run test:coverage` (motor ≥ 90%) e `npm run test:e2e` verdes.
- `npm run lint` e `npm run typecheck` sem erros.
- Critério da fase atendido: as Builds de referência geram Pontuações coerentes e testadas, e o painel explica cada penalidade.
- `docs/pontuacao.md` publicado, e o roadmap com os entregáveis da Fase 6 marcados.
