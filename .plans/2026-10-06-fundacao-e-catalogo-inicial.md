---
titulo: Fundação do projeto e Catálogo inicial validado
data: 2026-10-06
status: aprovado
---

# Plano: Fundação do projeto e Catálogo inicial validado

**Origem:** `docs/roadmap-pc-builder-pro.md`, Fase 1: Fundação e Catálogo inicial

## Objetivo

Deixar o projeto rodando (Vite + React + TS, lint, testes, build e CI) com um Catálogo inicial de ~40 Peças em JSON, tipado e validado por schema Zod. Esse schema é a base de que as regras da Fase 2 e a Bancada da Fase 4 vão depender.

## Escopo

**Inclui:**
- Scaffold Vite + React + TypeScript, ESLint, Prettier, Vitest e os scripts `dev`, `lint`, `test` e `build`.
- `git init` e workflow do GitHub Actions (lint, test, build a cada push e PR).
- Schema Zod por Categoria (união discriminada por `categoria`) com as specs de compatibilidade e a Faixa de preço.
- Catálogo com 4 a 6 Peças por Categoria (cerca de 40) em um JSON por Categoria, mais `meta.json` com a Data de referência.
- Função `validarCatalogo` e testes que validam o Catálogo real e casos inválidos.
- Página mínima em pt-BR mostrando o nome do app, a quantidade de Peças e a Data de referência (só para provar que o Catálogo carrega no navegador).

**Não inclui:**
- Regras de compatibilidade, Orçamento e Checklist (Fase 2).
- Índices de desempenho (Fase 6). O schema não terá esses campos agora.
- Playwright, dnd-kit e Framer Motion (entram nas Fases 3 e 4).
- Criar o repositório remoto no GitHub e fazer o primeiro push (fica com o usuário).

## Premissas

- O roadmap diz "mín > médio > máx", o que parece erro de digitação. A regra adotada é **mín ≤ médio ≤ máx**, com todos os valores > 0.
- Os preços são estimativas plausíveis em R$ para 2026-10 (Data de referência `"2026-10"`), a serem revisados na curadoria da Fase 8.
- Os valores em R$ são inteiros em reais (ex.: `1299`).
- O consumo (`consumoW`) é obrigatório só para CPU e GPU. A Fase 2 soma uma margem fixa para o resto da Build.
- Um kit de RAM é uma Peça (ex.: 2×16 GB) com `modulos` e `capacidadeTotalGB`. A regra "pentes ≤ slots DIMM" da Fase 2 usa `modulos`.
- IDs das Peças são slugs kebab-case únicos em todo o Catálogo, prefixados pela Categoria (ex.: `cpu-ryzen-5-7600`). O prefixo é convenção validada em teste.
- O Catálogo inicial precisa cobrir o cenário de teste da Fase 2: plataforma AM5/DDR5 e LGA1700/DDR4, com pelo menos uma CPU sem vídeo integrado, uma sem cooler box, um gabinete que não aceita ATX e um armazenamento SATA.
- Node 22 e npm (já instalados). Zod 4.

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Scaffold | `npm create vite@latest` com o template `react-ts` gerado no scratchpad e copiado para a raiz | A pasta já tem `docs/` e `GLOSSARY.md`; o create-vite reclama de diretório não vazio |
| Config do Vitest | Bloco `test` no `vite.config.ts` (via `vitest/config`), ambiente `node` | Um arquivo de config só; os testes da Fase 1 não precisam de DOM |
| ESLint + Prettier | Flat config do template + `eslint-config-prettier`; `lint` = `eslint . && prettier --check .` | O lint falha na CI se a formatação divergir |
| Fim de linha | `.gitattributes` com `* text=auto eol=lf` e `endOfLine: "lf"` no Prettier | Evita diff e falha do Prettier entre Windows e a CI Linux |
| Schema | `z.discriminatedUnion("categoria", [...])` com um objeto base compartilhado | Os tipos TS saem do schema (`z.infer`) e o TS faz o narrowing por Categoria nas regras da Fase 2 |
| Objetos do schema | `z.strictObject` | Erro de digitação em nome de campo vira falha de validação em vez de ser ignorado |
| Dados | `src/catalogo/dados/<categoria>.json` + `meta.json`, importados estaticamente | Edição manual mais fácil com 150 Peças; o Vite empacota o JSON sem fetch |
| Validação | `validarCatalogo(entrada): ResultadoValidacao` pura, sem lançar erro; `carregarCatalogo()` lança se for inválido | Testável com fixtures; o app falha cedo se o JSON estiver quebrado |
| Nomes | Identificadores e campos em pt-BR (camelCase sem acento) | Seguem o vocabulário do `GLOSSARY.md` |

### Formato do schema (`src/catalogo/schema.ts`)

```ts
export const CATEGORIAS = ["cpu", "placa-mae", "ram", "gpu", "armazenamento", "fonte", "gabinete", "cooler"] as const;
export const SOCKETS = ["AM4", "AM5", "LGA1700", "LGA1851"] as const;
export const TIPOS_RAM = ["DDR4", "DDR5"] as const;
export const FORM_FACTORS = ["ATX", "Micro-ATX", "Mini-ITX"] as const;

FaixaPreco      = { min: int > 0, medio: int > 0, max: int > 0 }  // refine: min ≤ medio ≤ max
base            = { id: slug, nome: string, marca: string, faixaPreco: FaixaPreco }

cpu             = base + { categoria: "cpu", socket, nucleos, threads, consumoW, videoIntegrado: boolean, coolerBox: boolean }
placa-mae       = base + { categoria: "placa-mae", socket, tipoRam, formFactor, slotsDimm, slotsM2, slotsPcieX16, portasSata }
ram             = base + { categoria: "ram", tipoRam, capacidadeTotalGB, modulos, frequenciaMHz }
gpu             = base + { categoria: "gpu", consumoW, vramGB, fonteRecomendadaW }
armazenamento   = base + { categoria: "armazenamento", formato: "M.2" | "2.5", interface: "NVMe" | "SATA", capacidadeGB }
fonte           = base + { categoria: "fonte", potenciaW, certificacao: "80 Plus" | "Bronze" | "Gold" | "Platinum" | "Titanium" }
gabinete        = base + { categoria: "gabinete", formFactorsSuportados: FormFactor[] (≥ 1) }
cooler          = base + { categoria: "cooler", tipo: "ar" | "water", socketsSuportados: Socket[] (≥ 1) }

Peca            = discriminatedUnion("categoria", [...])
Catalogo        = { dataReferencia: "AAAA-MM", pecas: Peca[] }
```

Tipos exportados: `Categoria`, `Peca`, `PecaDe<C extends Categoria>`, `FaixaPreco`, `Catalogo`.

### Contrato de validação (`src/catalogo/validar.ts`)

```ts
type ErroCatalogo = { caminho: string; mensagem: string };   // ex.: { caminho: "pecas[3].faixaPreco", mensagem: "..." }
type ResultadoValidacao = { ok: true; catalogo: Catalogo } | { ok: false; erros: ErroCatalogo[] };
function validarCatalogo(entrada: unknown): ResultadoValidacao;
```

`validarCatalogo` roda o `Catalogo.safeParse` e depois as checagens entre Peças: IDs repetidos e prefixo do ID igual à Categoria. As mensagens ficam em pt-BR (ex.: `ID duplicado: "cpu-ryzen-5-7600"`, `Faixa de preço inválida: mín 900 > médio 800`).

## Arquivos afetados

- `package.json`, `package-lock.json` (novos): dependências e scripts `dev`, `build`, `preview`, `lint`, `format`, `test`, `test:watch`, `typecheck`.
- `vite.config.ts` (novo): plugin React e bloco `test`.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` (novos, do template): `resolveJsonModule` ligado.
- `eslint.config.js`, `.prettierrc.json`, `.prettierignore` (novos).
- `.gitignore`, `.gitattributes`, `.nvmrc` (`22`) (novos).
- `.github/workflows/ci.yml` (novo): `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` em `ubuntu-latest`, Node pelo `.nvmrc`, com cache de npm. Dispara em `push` e `pull_request`.
- `index.html` (novo): `lang="pt-BR"`, título "PC Builder Pro".
- `src/main.tsx`, `src/App.tsx`, `src/index.css` (novos): página mínima; o resto do boilerplate do template (logos, contador, `App.css`) é removido.
- `src/catalogo/schema.ts` (novo): schemas Zod e tipos.
- `src/catalogo/validar.ts` (novo): `validarCatalogo`.
- `src/catalogo/index.ts` (novo): junta os JSONs e exporta `carregarCatalogo()` (memoizado) e os tipos.
- `src/catalogo/dados/{cpu,placa-mae,ram,gpu,armazenamento,fonte,gabinete,cooler}.json` (novos): 4 a 6 Peças cada.
- `src/catalogo/dados/meta.json` (novo): `{ "dataReferencia": "2026-10" }`.
- `src/catalogo/schema.test.ts` (novo): casos válidos e inválidos por Categoria com fixtures.
- `src/catalogo/validar.test.ts` (novo): regras entre Peças.
- `src/catalogo/catalogo.test.ts` (novo): valida o Catálogo real.
- `README.md` (novo, curto): como rodar e onde ficam os dados.

## Passos de implementação

1. Gerar o template `react-ts` no scratchpad, copiar para a raiz sem tocar em `docs/`, `GLOSSARY.md` e `.claude/`, e limpar o boilerplate.
2. Instalar `zod`, `vitest`, `prettier` e `eslint-config-prettier`. Configurar Prettier, ESLint, Vitest e os scripts. Confirmar que `dev`, `lint`, `test` (com um teste trivial) e `build` passam.
3. `git init`, `.gitignore`, `.gitattributes`, `.nvmrc` e `.github/workflows/ci.yml`.
4. Escrever `schema.ts` em TDD, uma Categoria por vez, com os testes de `schema.test.ts`.
5. Escrever `validar.ts` em TDD com os testes de `validar.test.ts`.
6. Preencher os JSONs de `dados/` e o `meta.json`, cobrindo as plataformas e os casos de borda listados nas Premissas.
7. `index.ts` com `carregarCatalogo()` e `catalogo.test.ts` sobre os dados reais.
8. `App.tsx` exibindo o total de Peças e a Data de referência formatada ("outubro de 2026"). Escrever o README.
9. Rodar `npm run lint && npm run typecheck && npm test && npm run build`. Primeiro commit local.

## Comportamentos a testar

- [ ] `FaixaPreco` aceita `{ min: 800, medio: 900, max: 1000 }` e `{ min: 900, medio: 900, max: 900 }`.
- [ ] `FaixaPreco` rejeita mín > médio, médio > máx, valores zero, negativos ou não inteiros.
- [ ] O schema aceita uma CPU válida e rejeita uma CPU sem `socket`, com socket fora da lista ou com campo desconhecido.
- [ ] O schema aceita uma placa-mãe válida e rejeita `slotsDimm` 0 ou `tipoRam` inválido.
- [ ] O schema aceita RAM, GPU, armazenamento, fonte, gabinete e cooler válidos (um caso por Categoria).
- [ ] O schema rejeita gabinete com `formFactorsSuportados` vazio e cooler com `socketsSuportados` vazio.
- [ ] O schema rejeita uma Peça com `categoria` desconhecida.
- [ ] O schema rejeita armazenamento `formato: "2.5"` com `interface: "NVMe"`.
- [ ] `Catalogo` rejeita `dataReferencia` fora do formato `AAAA-MM` (ex.: `"10/2026"`, `"2026-13"`).
- [ ] `Catalogo` rejeita ID que não é slug kebab-case (ex.: `"CPU Ryzen"`).
- [ ] `validarCatalogo` retorna `ok: true` com o Catálogo tipado para uma entrada válida.
- [ ] `validarCatalogo` retorna um erro com o ID quando dois IDs se repetem, mesmo em Categorias diferentes.
- [ ] `validarCatalogo` retorna erro quando o prefixo do ID não bate com a Categoria (ex.: `gpu-x` com `categoria: "cpu"`).
- [ ] `validarCatalogo` retorna o caminho da Peça problemática (ex.: `pecas[3].faixaPreco`) e junta vários erros em vez de parar no primeiro.
- [ ] O Catálogo real passa em `validarCatalogo` sem erros.
- [ ] O Catálogo real tem de 4 a 6 Peças por Categoria e cerca de 40 no total.
- [ ] O Catálogo real tem placas-mãe AM5/DDR5 e LGA1700/DDR4, com CPUs e RAM compatíveis com cada uma.
- [ ] O Catálogo real tem pelo menos uma CPU sem vídeo integrado, uma sem cooler box, um gabinete que não aceita ATX e um armazenamento SATA.
- [ ] `carregarCatalogo()` devolve a Data de referência `"2026-10"` e todas as Peças dos JSONs.

**Framework e comando de testes:** Vitest, `npm test` (`vitest run`); `npm run test:watch` durante o TDD.

## Mapeamento com o roadmap

| Entregável da fase | Passos / testes que o cobrem |
|---|---|
| Projeto Vite + React + TS com ESLint, Prettier e Vitest; scripts funcionando | Passos 1, 2, 8 e 9 |
| CI com lint, testes e build a cada push | Passo 3 |
| Schema Zod por Categoria com specs de compatibilidade e Faixa de preço | Passo 4; testes 1 a 10 |
| Catálogo inicial de ~40 Peças em JSON + Data de referência | Passos 6 e 7; testes 15 a 19 |
| Teste que valida o Catálogo, IDs repetidos e Faixa de preço inválida | Passo 5; testes 2 e 11 a 15 |

## Riscos e pontos de atenção

- O schema limita o que as Fases 2, 4 e 6 conseguem fazer. Antes de fechar o passo 4, conferir cada regra da Fase 2 contra os campos: socket (cpu, placa-mae), tipoRam (ram, placa-mae), formFactor/formFactorsSuportados, modulos ≤ slotsDimm, formato "M.2" ≤ slotsM2, consumoW × potenciaW, videoIntegrado e coolerBox no Checklist.
- Algumas CPUs Intel aceitam DDR4 e DDR5, mas a compatibilidade real é definida pela placa-mãe. Por isso a CPU não tem `tipoRam`.
- Os preços inventados podem confundir. A Data de referência e o README deixam claro que são estimativas até a Fase 8.
- A CI só roda depois que o usuário criar o repositório no GitHub e fizer o push.

## Critério de pronto

- Todos os comportamentos acima com teste passando.
- `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passam localmente; `npm run dev` abre a página com o total de Peças e a Data de referência.
- O workflow da CI está pronto para rodar no primeiro push (critério de conclusão da Fase 1: "`npm test` valida o Catálogo inicial e a CI passa").
