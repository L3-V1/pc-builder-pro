---
titulo: Motor de regras (compatibilidade, Orçamento e Checklist)
data: 2026-10-06
status: aprovado
---

# Plano: Motor de regras (compatibilidade, Orçamento e Checklist)

**Origem:** `docs/roadmap-pc-builder-pro.md`, Fase 2: Motor de regras

## Objetivo

Ter toda a lógica do domínio em TypeScript puro, sem interface: modelo de Build com encaixe e remoção, Incompatibilidades Bloqueantes e Alerta de fonte, Orçamento, Checklist condicional e a lista de Peças deslocadas numa troca de placa-mãe. Tudo coberto por testes de unidade com cobertura ≥ 90% em `src/motor/`.

## Escopo

**Inclui:**
- Módulo `src/motor/` (funções puras e imutáveis) com Build, regras, Orçamento e Checklist.
- Bloqueantes do roadmap: socket CPU↔placa-mãe, tipo de RAM↔placa-mãe, form factor placa-mãe↔gabinete, pentes ≤ slots DIMM, discos M.2 ≤ slots M.2.
- Alerta de fonte com margem configurável.
- Cobertura com `@vitest/coverage-v8`, limiar de 90% para `src/motor/**`, verificada na CI.

**Não inclui:**
- Qualquer UI ou estado React (Fase 3).
- Bandeja como estrutura de dados (Fase 4); o motor só devolve as Peças `removidas`.
- Serialização/persistência da Build (Fase 5).
- Regras extras: cooler↔socket, SATA ≤ portas SATA, PCIe (decisão do usuário: nenhuma extra).

## Premissas

- **Ordem livre:** qualquer Peça entra a qualquer momento; as regras só comparam Peças presentes. Sem placa-mãe não há limite de pentes nem de M.2.
- **Placa-mãe desloca:** encaixar uma placa-mãe nunca é bloqueado. Ela substitui a anterior e tira da Build as Peças que ficariam incompatíveis; essas voltam em `removidas`.
- Excedentes na troca de placa (pentes ou M.2 acima dos slots): mantêm-se as Peças encaixadas primeiro; saem as mais recentes.
- Encaixar Peça de Categoria única (CPU, GPU, fonte, gabinete, cooler) com outra já presente substitui a anterior, que volta em `removidas`. As regras são checadas contra a Build sem a Peça substituída.
- Consumo estimado = `cpu.consumoW + gpu.consumoW + 100 W` (resto da Build). Alerta quando `fonte.potenciaW < max(ceil(consumo × (1 + margem)), gpu.fonteRecomendadaW)`. Margem padrão 0,3; margem negativa lança `RangeError`. Sem fonte, não há Alerta.
- Checklist: sem CPU encaixada, GPU e cooler contam como exigidos (postura conservadora até a CPU dizer o contrário).
- `remover` recebe o ID e tira uma ocorrência (a mais recente), já que o mesmo kit de RAM pode estar duas vezes.
- Testes usam Peças reais do Catálogo via `carregarCatalogo()`; o teste da Fase 1 já garante os casos de borda.

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Pasta | `src/motor/` ao lado de `src/catalogo/` | Separa domínio puro de dados e de UI |
| Representação da Build | Objeto imutável com as próprias `Peca` (não IDs) | Regras e Orçamento leem specs direto; IDs só importam na Fase 5 |
| Erros de encaixe | Resultado discriminado `{ ok: true \| false }`, sem exceção | Mesmo padrão de `validarCatalogo` |
| Mensagens | Texto pt-BR em cada `Incompatibilidade` | A Fase 3 exibe direto no card e no botão |
| Cobertura | `@vitest/coverage-v8@5.0.3` + `test.coverage.thresholds` no `vite.config.ts` | Critério de conclusão da fase; versão casada com o Vitest |

### Contratos (`src/motor/`)

```ts
type CategoriaUnica = 'cpu' | 'placa-mae' | 'gpu' | 'fonte' | 'gabinete' | 'cooler'
type Build = Readonly<{ [C in CategoriaUnica]?: PecaDe<C> }> & {
  readonly ram: readonly PecaDe<'ram'>[]
  readonly armazenamento: readonly PecaDe<'armazenamento'>[]
}

type RegraId = 'socket' | 'tipo-ram' | 'form-factor' | 'slots-dimm' | 'slots-m2' | 'fonte'
type Incompatibilidade = {
  regra: RegraId
  severidade: 'bloqueante' | 'alerta'
  pecas: string[]          // IDs envolvidos
  mensagem: string
}

type ResultadoEncaixe =
  | { ok: true; build: Build; removidas: Peca[] }
  | { ok: false; bloqueios: Incompatibilidade[] }

criarBuild(): Build
pecasDaBuild(build): Peca[]
encaixar(build, peca): ResultadoEncaixe
remover(build, pecaId): Build                    // ID ausente → mesma Build
verificarEncaixe(build, peca): Incompatibilidade[]   // Bloqueantes que impediriam o encaixe (placa-mãe → sempre [])
pecasIncompativeisComPlaca(build, placa): Peca[]     // para a Bandeja da Fase 4
consumoEstimadoW(build): number
verificarFonte(build, margem = 0.3): Incompatibilidade | undefined
verificarBuild(build, opcoes?: { margemFonte?: number }): Incompatibilidade[]
calcularOrcamento(build): FaixaPreco | { min: 0; medio: 0; max: 0 }
calcularChecklist(build): { faltando: Categoria[]; completa: boolean }  // ordem de CATEGORIAS
```

## Arquivos afetados

- `src/motor/build.ts` (novo) — tipo `Build`, `criarBuild`, `pecasDaBuild`, `encaixar`, `remover`.
- `src/motor/compatibilidade.ts` (novo) — `Incompatibilidade`, `verificarEncaixe`, `pecasIncompativeisComPlaca`, `verificarBuild`.
- `src/motor/fonte.ts` (novo) — `consumoEstimadoW`, `verificarFonte`.
- `src/motor/orcamento.ts` (novo) — `calcularOrcamento`.
- `src/motor/checklist.ts` (novo) — `calcularChecklist`.
- `src/motor/index.ts` (novo) — reexporta a API pública.
- `src/motor/*.test.ts` (novos) — um arquivo de teste por módulo, mais `troca-placa.test.ts` com o cenário AM5→LGA1700.
- `src/motor/teste-pecas.ts` (novo) — helper de teste `peca(id)` que busca no Catálogo real com tipo estreitado; excluído da cobertura.
- `vite.config.ts` (alterado) — bloco `coverage` (provider v8, include `src/motor/**`, exclude testes/helper, thresholds 90).
- `package.json` (alterado) — devDependency `@vitest/coverage-v8`, script `test:coverage`.
- `.github/workflows/ci.yml` (alterado) — `npm test` vira `npm run test:coverage`.
- `docs/roadmap-pc-builder-pro.md` (alterado, ao final) — marcar entregáveis e status da Fase 2.

## Passos de implementação

1. Instalar `@vitest/coverage-v8@5.0.3`, configurar coverage no `vite.config.ts`, script `test:coverage` e CI.
2. `build.ts`: tipo `Build`, `criarBuild`, `pecasDaBuild`, `remover`, e `encaixar` ainda sem regras (substituição de Categoria única, acúmulo em RAM/armazenamento).
3. `orcamento.ts` e `checklist.ts` (dependem só de `Build`).
4. `compatibilidade.ts`: `verificarEncaixe` com as 5 regras Bloqueantes; ligar em `encaixar`.
5. `pecasIncompativeisComPlaca` e ramo da placa-mãe em `encaixar` (substitui + desloca).
6. `fonte.ts` e `verificarBuild` (Bloqueantes residuais + Alerta).
7. `index.ts`, rodar `npm run test:coverage`, `lint`, `typecheck`; atualizar o roadmap.

## Comportamentos a testar

Build e quantidades
- [ ] `criarBuild` devolve Build vazia: sem Peças únicas, `ram` e `armazenamento` vazios.
- [ ] `encaixar` uma CPU numa Build vazia devolve `ok`, Build com a CPU e `removidas` vazio, sem alterar a Build original.
- [ ] Encaixar uma segunda CPU substitui a primeira, que vem em `removidas`.
- [ ] RAM e armazenamento acumulam várias Peças (inclusive o mesmo kit duas vezes).
- [ ] `remover` tira a Peça única pelo ID; em RAM tira só uma ocorrência; ID ausente devolve Build equivalente.
- [ ] `pecasDaBuild` lista todas as Peças encaixadas.

Orçamento e Checklist
- [ ] `calcularOrcamento` de Build vazia é `{0, 0, 0}`.
- [ ] Soma mín, médio e máx de todas as Peças, contando kits repetidos duas vezes.
- [ ] Checklist da Build vazia lista todas as Categorias (GPU e cooler incluídos) e `completa: false`.
- [ ] CPU com vídeo integrado tira a GPU do Checklist; CPU com cooler box tira o cooler.
- [ ] CPU sem vídeo integrado (Ryzen 5 5600) e sem cooler box (7800X3D) mantêm GPU / cooler.
- [ ] Build completa e compatível tem `faltando: []` e `completa: true`.

Bloqueantes
- [ ] CPU de socket diferente da placa-mãe é bloqueada com regra `socket` (e vice-versa não, pois placa desloca).
- [ ] RAM DDR4 em placa DDR5 é bloqueada com regra `tipo-ram`.
- [ ] Gabinete que não aceita o form factor da placa (ATX no gabinete-kmex-matx) é bloqueado com `form-factor`.
- [ ] Pentes acima de `slotsDimm` são bloqueados com `slots-dimm` (2º kit de 2 pentes numa placa de 2 slots); dentro do limite passa.
- [ ] M.2 acima de `slotsM2` bloqueado com `slots-m2`; SATA 2.5 não conta para esse limite.
- [ ] Sem placa-mãe, CPU, RAM e M.2 entram sem bloqueio nem limite.
- [ ] Bloqueio devolve `ok: false`, IDs envolvidos e mensagem em pt-BR; a Build não muda.
- [ ] Substituir CPU checa a nova contra a placa, ignorando a CPU que sai.

Troca de placa-mãe
- [ ] `pecasIncompativeisComPlaca` lista CPU de outro socket, RAM de outro tipo e gabinete incompatível.
- [ ] Lista os pentes e M.2 excedentes, mantendo os encaixados primeiro.
- [ ] Cenário do roadmap: Build AM5/DDR5 completa (7600, B650M Aorus Elite, DDR5, NVMe, gabinete mATX…) trocada pela B760M DS3H DDR4 → CPU e RAM saem em `removidas` junto com a placa antiga; armazenamento, gabinete, fonte e GPU ficam.
- [ ] Primeira placa encaixada numa Build com Peças incompatíveis também desloca.
- [ ] `verificarEncaixe` de placa-mãe devolve sempre `[]`.

Fonte
- [ ] `consumoEstimadoW` = CPU + GPU + 100, com ausentes contando 0.
- [ ] Sem fonte, `verificarFonte` devolve `undefined`.
- [ ] Fonte abaixo de `consumo × 1,3` gera Alerta `fonte` com severidade `alerta`; acima, nada.
- [ ] Fonte abaixo de `gpu.fonteRecomendadaW`, mesmo cobrindo a margem, gera Alerta.
- [ ] Margem configurável muda o resultado (ex.: margem 0 deixa passar); margem negativa lança `RangeError`.
- [ ] Alerta não impede `encaixar` a fonte.
- [ ] `verificarBuild` devolve o Alerta da fonte e `[]` para Build compatível com folga.

**Framework e comando de testes:** Vitest (ambiente `node`), `npm test`; cobertura com `npm run test:coverage`.

## Mapeamento com o roadmap

| Entregável da fase | Passos / testes que o cobrem |
|---|---|
| Modelo de Build: encaixar/remover, quantidades e Slots da placa | Passos 2, 4 · testes "Build e quantidades", slots DIMM/M.2 |
| Regras Bloqueantes (socket, RAM, form factor, DIMM, M.2) | Passo 4 · testes "Bloqueantes" |
| Alerta de fonte com margem configurável | Passo 6 · testes "Fonte" |
| Orçamento (médio e mín–máx) só com encaixadas | Passo 3 · testes "Orçamento" |
| Checklist condicional (GPU / cooler) | Passo 3 · testes "Checklist" |
| Função de Peças incompatíveis na troca de placa | Passo 5 · testes "Troca de placa-mãe" |
| Testes por regra, cenário AM5/DDR5 → LGA1700/DDR4 | Todos · `troca-placa.test.ts` |
| Cobertura ≥ 90% | Passo 1, 7 · `npm run test:coverage` |

## Riscos e pontos de atenção

- Testes ancorados em IDs do Catálogo real quebram se a Fase 8 renomear Peças; o helper `peca(id)` falha com mensagem clara.
- "Placa desloca" na primeira placa pode surpreender na Fase 3 (clicar numa placa errada manda Peças para fora). A UI deve avisar usando `pecasIncompativeisComPlaca` antes de confirmar.
- O valor fixo de 100 W é uma aproximação; fica como constante nomeada para ajuste.

## Critério de pronto

- Todos os comportamentos acima com teste passando; `npm run test:coverage` verde com ≥ 90% em `src/motor/**`.
- `npm run lint`, `npm run typecheck` e `npm run build` passando; CI atualizada.
- Entregáveis da Fase 2 marcados no roadmap.
