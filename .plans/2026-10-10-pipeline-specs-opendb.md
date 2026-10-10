---
titulo: Pipeline de specs a partir do OpenDB
data: 2026-10-10
status: aprovado
---

# Plano: Pipeline de specs a partir do OpenDB

**Origem:** `docs/roadmap-pc-builder-pro.md`, Fase 11: Pipeline de specs a partir do OpenDB (depende da Fase 9, concluída)

## Objetivo

`npm run pipeline` baixa o BuildCores OpenDB num commit fixado, normaliza CPU, placa-mãe, RAM, GPU, armazenamento, fonte, gabinete e cooler para o schema Zod do app, junta Índices curados e as Faixas de preço do Catálogo antigo e grava `public/dados/` válido. Toda Peça passa a ter ID `categoria-marca-modelo`. Os 152 IDs antigos continuam resolvendo (links, localStorage, Desafios) por um `aliases.json` publicado e consultado pelo app.

## Escopo

**Inclui:**
- Pasta `pipeline/` (Node + TypeScript via `tsx`) com download, leitura, normalização, slug, montagem, escrita e relatório de descartes.
- Curadoria versionada: Índices de CPU e GPU (com `fonteRecomendadaW` da GPU e `indiceVideoIntegrado` da CPU) e pares "ID antigo → opendb_id".
- O Catálogo antigo vira insumo do pipeline (`pipeline/legado/`), usado só para preços, Data de referência e aliases.
- O app carrega `dados/aliases.json` e `resolverIds` resolve IDs antigos.
- Atribuição CC BY-NC-SA 4.0 no app (rodapé) e no README.

**Não inclui:**
- Coleta de preços / Mercado Livre (Fase 12). A `dataReferencia` continua `AAAA-MM`, vinda do legado.
- Workflow agendado, retirar `public/dados/` do Git, Peças fora de venda (Fases 13 e 14).
- Reescrever `docs/atualizar-catalogo.md` e `docs/pontuacao.md` (Fase 15). Nesta fase só uma nota curta apontando para o pipeline.

## Premissas

- OpenDB não tem tags: fixa-se o SHA `50059f5ec7ba1c28c20ed6ca53b2954d8d03f042` (main em 2026-10-09) numa constante. Download pelo tarball do codeload, extraído com `tar` do sistema (presente no Ubuntu da CI e no Windows 10+) em `pipeline/.cache/opendb-<sha>/`, que fica no `.gitignore` e é reaproveitado.
- `tsx` entra como devDependency para rodar o pipeline (reaproveita `src/catalogo/schema.ts` e `validar.ts`, que importam sem extensão).
- Mapeamentos de specs (OpenDB → app):
  - **CPU:** `socket` "LGA 1700" → `LGA1700` (fora de `SOCKETS` = descarte); `cores.total`/`cores.threads`; `consumoW` = `specifications.tdp`; `videoIntegrado` = `specifications.integratedGraphics` presente; `coolerBox` = `specifications.includesCooler`.
  - **Placa-mãe:** `form_factor` "Micro ATX" → `Micro-ATX` (EATX etc. = descarte); `memory.ram_type` e `memory.slots`; `slotsM2` = soma de `m2_slots` com key `M` ou `B+M`; `slotsPcieX16` = soma de `quantity` de `pcie_slots` com `lanes` 16; `portasSata` = `storage_devices.sata_6_gb_s` (+ `sata_3_gb_s`).
  - **RAM:** `ram_type`, `capacity` (ou `modules.quantity × capacity_gb`), `modules.quantity`, `speed`; só DIMM desktop (SO-DIMM = descarte).
  - **GPU:** `tdp` → `consumoW`, `memory` → `vramGB`; Índices e `fonteRecomendadaW` vêm da curadoria por chipset (`chipset`, ex.: "GeForce RTX 4060").
  - **Armazenamento:** `form_factor` `M.2-*` → `M.2`, `2.5"` → `2.5` (3.5"/HDD = descarte); `interface` NVMe se `nvme` ou interface PCIe, senão SATA; `capacity` → `capacidadeGB`.
  - **Fonte:** `wattage`; `efficiency_rating` "80+ Gold" → `Gold` etc., "80+ Standard/White/80+" → `80 Plus`. O enum do app ganha `Silver` (existe no OpenDB e no mercado).
  - **Gabinete:** `supported_motherboard_form_factors` filtrado para `FORM_FACTORS` (vazio = descarte).
  - **Cooler:** `water_cooled` → `water`/`ar`; `cpu_sockets` filtrado para `SOCKETS` (vazio = descarte).
- `marca` = `metadata.manufacturer`; `nome` = `metadata.name` sem o prefixo da marca. Em GPU, a marca passa a ser a do fabricante da placa (ASUS, MSI…), não a do chip.
- Chave dos Índices de CPU: modelo normalizado (ex.: `ryzen-5-5600`). De GPU: `chipset`. Valores semeados com os do Catálogo atual, sem recalibrar.
- Ordem de saída: a ordem do legado (a relevância da busca depende dela).
- O relatório de descartes vai para `pipeline/.cache/relatorio.json` e um resumo por Categoria/motivo é impresso no console. Não é publicado.

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| IDs | Slug `categoria-marca-modelo` para todas as Peças; `dados/aliases.json` (antigo → novo) publicado e lido pelo app | Um esquema só de IDs; links e Builds antigas continuam (escolha do usuário) |
| Granularidade da GPU | Um registro do OpenDB por Peça; ID antigo aponta para uma variante representativa | Fiel à fonte e casa com a coleta por modelo da Fase 12 (escolha do usuário) |
| Peças antigas genéricas | Curadoria liga cada ID antigo a um opendb_id equivalente; nada manual fora do OpenDB | Teste garante que os 152 resolvem (escolha do usuário) |
| Saída | Sobrescreve `public/dados/`, que segue versionado até a Fase 13; legado movido para `pipeline/legado/` | App, testes de dados e CI não mudam de lugar (escolha do usuário) |
| Colisão de slug | Todas as Peças que colidem recebem sufixo com os 8 primeiros caracteres do `opendb_id` | Determinístico e estável entre execuções |
| Quem entra no Catálogo | Peça normalizada com sucesso **e** com par no legado (tem preço) **e**, se CPU/GPU, com Índice | Critério da fase: "só entram Peças que têm preço" |
| Falha dura | Pipeline sai com código ≠ 0 se a saída não passa em `validarCatalogo` ou se algum ID antigo não resolve | Não gravar dados quebrados |
| Normalizador | Funções puras `normalizarX(registro): {ok:true, peca} \| {ok:false, motivo}` | Testáveis com amostras; motivos alimentam o relatório |
| Aliases no app | `Catalogo` ganha `aliases: Record<string,string>` (default `{}`); `resolverIds(ids, pecas, aliases = {})` | Mantém a assinatura atual compatível |

## Arquivos afetados

- `pipeline/config.ts` (novo): SHA do OpenDB, mapa Categoria do app ↔ pasta do OpenDB (`CPU`, `Motherboard`, `RAM`, `GPU`, `Storage`, `PSU`, `PCCase`, `CPUCooler`), caminhos.
- `pipeline/opendb/baixar.ts` (novo): baixa o tarball do SHA (se não houver cache) e extrai só `open-db/<pastas>`.
- `pipeline/opendb/ler.ts` (novo): lê os JSON de uma pasta e devolve os registros (`unknown`).
- `pipeline/normalizar/enums.ts` (novo): mapas de socket, form factor, certificação, armazenamento.
- `pipeline/normalizar/index.ts` + um arquivo por Categoria (novos): normalizadores puros.
- `pipeline/slug.ts` (novo): `slugPeca(categoria, marca, nome)` e `resolverColisoes(pecas)`.
- `pipeline/montar.ts` (novo): `montarCatalogo({ registros, indices, pares, legado })` → `{ catalogo, aliases, relatorio }`.
- `pipeline/escrever.ts` (novo): grava `public/dados/<categoria>.json`, `meta.json`, `aliases.json`.
- `pipeline/main.ts` (novo): orquestra, imprime o resumo e define o código de saída.
- `pipeline/curadoria/indices-cpu.json`, `indices-gpu.json`, `pares-legado.json` (novos) + schema Zod deles em `pipeline/curadoria/schema.ts`.
- `pipeline/legado/*.json` (movidos de `public/dados/`).
- `pipeline/ferramentas/sugerir-pares.ts` (novo, auxiliar): lista candidatos do OpenDB por similaridade de nome para cada ID antigo, para preencher `pares-legado.json`.
- `pipeline/teste/amostras/*.json` (novos): registros reais do OpenDB, inclusive com specs faltando e enums exóticos.
- `tsconfig.pipeline.json` (novo) e `tsconfig.json` (referência); `package.json` (script `pipeline`, devDep `tsx`); `.gitignore` (`pipeline/.cache`).
- `src/catalogo/schema.ts` (alterado): `Silver` em certificação; `aliases` no `Catalogo`.
- `src/catalogo/carregar.ts` (alterado): busca também `aliases.json`.
- `src/persistencia/remontar.ts` e `iniciar.ts` (alterados): resolver via aliases.
- `src/teste/catalogo.json`, `src/teste/respostaDados.ts`, `src/teste/dadosPublicados.ts` (alterados): fixture e leitura com aliases.
- `src/catalogo/catalogo.test.ts`, `src/desafios/solucoes.test.ts` (alterados): IDs antigos resolvidos por aliases.
- `src/Aplicacao.tsx` (ou o layout principal) + CSS (alterado): rodapé de atribuição.
- `README.md` (alterado): seção do pipeline e atribuição. `docs/atualizar-catalogo.md`: nota de que os dados agora vêm de `npm run pipeline`.

## Passos de implementação

1. **Infra:** `tsx`, script `pipeline`, `tsconfig.pipeline.json`, `.gitignore`. Mover `public/dados/*` para `pipeline/legado/`.
2. **Slug** (`slug.ts`) com testes: acentos, símbolos, marca repetida no nome, colisões.
3. **Enums e normalizadores** por Categoria, testados com amostras reais em `pipeline/teste/amostras/`.
4. **Curadoria:** schema Zod dos três arquivos; semear `indices-cpu.json` e `indices-gpu.json` a partir de `pipeline/legado/`; rodar `sugerir-pares.ts` e preencher `pares-legado.json` com os 152 pares (variante representativa para GPU, equivalente de mesma capacidade para as Peças genéricas).
5. **Montagem** (`montar.ts`): filtra por par + Índice, aplica preço do legado, gera slugs, aliases e relatório.
6. **Download/leitura** (`baixar.ts`, `ler.ts`) e **escrita** (`escrever.ts`); `main.ts` com validação final e códigos de saída.
7. **App:** `aliases` no schema e no `carregarCatalogo`; `resolverIds` com aliases; fixture e intercepts dos e2e com `aliases.json`.
8. Rodar `npm run pipeline`, gravar `public/dados/` gerado, ajustar `catalogo.test.ts` e `solucoes.test.ts`.
9. **Atribuição** no rodapé do app e no README; nota em `docs/atualizar-catalogo.md`; marcar entregáveis da Fase 11 no roadmap.

## Comportamentos a testar

- [ ] `slugPeca` gera `cpu-amd-ryzen-5-5600` a partir de categoria, marca e nome, removendo acentos e símbolos
- [ ] `slugPeca` não repete a marca quando o nome já começa com ela
- [ ] `resolverColisoes` adiciona o prefixo do `opendb_id` a todas as Peças com o mesmo slug, de forma estável
- [ ] mapa de socket converte "LGA 1700" → `LGA1700` e devolve indefinido para sockets fora do app
- [ ] `normalizarCpu` converte uma amostra completa (socket, núcleos, threads, consumo, vídeo integrado, cooler box)
- [ ] `normalizarCpu` descarta CPU sem socket ou sem TDP, com motivo "spec faltando: …"
- [ ] `normalizarCpu` descarta CPU de socket fora do app (ex.: AM3) com motivo "socket não suportado"
- [ ] `normalizarPlacaMae` conta slots M.2 (key M), slots PCIe x16 e portas SATA e mapeia "Micro ATX"
- [ ] `normalizarPlacaMae` descarta form factor EATX e placa sem `ram_type`
- [ ] `normalizarRam` aceita DIMM DDR4/DDR5 e descarta SO-DIMM e DDR3
- [ ] `normalizarGpu` extrai consumo e VRAM e devolve a chave de chipset; descarta GPU sem TDP
- [ ] `normalizarArmazenamento` mapeia M.2 NVMe, M.2 SATA e 2.5" SATA; descarta HDD 3.5"
- [ ] `normalizarFonte` mapeia certificações (incl. Silver e "80+ Standard") e descarta sem potência
- [ ] `normalizarGabinete` filtra form factors suportados e descarta lista vazia
- [ ] `normalizarCooler` mapeia `water_cooled` e filtra sockets; descarta sem socket suportado
- [ ] schemas da curadoria rejeitam Índice fora de 0–100 e par com opendb_id repetido
- [ ] `montarCatalogo` só inclui Peças com par no legado e aplica a Faixa de preço do ID antigo
- [ ] `montarCatalogo` exclui CPU/GPU sem Índice e registra o motivo no relatório
- [ ] `montarCatalogo` aplica Índices de GPU por chipset e `fonteRecomendadaW` da curadoria
- [ ] `montarCatalogo` gera `aliases` ID antigo → slug novo para todo par
- [ ] `montarCatalogo` falha (erro listando os IDs) quando um ID antigo não tem Peça normalizada
- [ ] `montarCatalogo` mantém a ordem do legado na saída
- [ ] a saída de `montarCatalogo` passa em `validarCatalogo`
- [ ] relatório conta normalizadas, descartadas por motivo e sem preço, por Categoria
- [ ] `carregarCatalogo` carrega `aliases.json` e devolve o Catálogo com aliases; erro tipado se ele faltar
- [ ] `resolverIds` resolve um ID antigo pelo alias e continua marcando IDs inexistentes como desconhecidos
- [ ] link e localStorage com IDs antigos remontam a mesma Build (`iniciarEstado`)
- [ ] (dados reais) `public/dados/` gerado passa no schema e os 152 IDs antigos resolvem por `aliases`
- [ ] (dados reais) todo Desafio continua com solução de referência (`solucoes.test.ts`)
- [ ] o app mostra a atribuição ao BuildCores OpenDB com link e licença
- [ ] e2e de montar Build e de link compartilhado continuam verdes

**Framework e comando de testes:** Vitest (`npm test`; o pipeline entra pelo padrão `**/*.test.ts`), Playwright (`npm run test:e2e`), mais `npm run lint` e `npm run typecheck`.

## Mapeamento com o roadmap

| Entregável da fase | Passos / testes que o cobrem |
|---|---|
| Script Node que baixa o OpenDB fixado e normaliza, descartando specs incompletas | Passos 1, 3, 6; testes de socket e normalizadores |
| Arquivo curado de Índices; CPU/GPU sem Índice fica de fora | Passos 4, 5; testes de curadoria e de exclusão sem Índice |
| Slug determinístico e aliases dos 152 IDs, com teste | Passos 2, 4, 5, 7, 8; testes de slug, aliases, `resolverIds` e dados reais |
| Faixas de preço do Catálogo antigo; só entram Peças com preço | Passo 5; teste de inclusão por par e preço |
| Atribuição ao OpenDB no app e no README | Passo 9; teste do rodapé |
| Testes do normalizador com amostras, incluindo specs faltando | Passo 3; testes dos normalizadores |

## Riscos e pontos de atenção

- Preencher `pares-legado.json` para 152 Peças é o maior trabalho manual. Algumas Peças antigas (genéricas ou de marca nacional, como `gabinete-pichau-ventus`) podem não ter equivalente bom no OpenDB.
- `pcie_slots[].lanes` no OpenDB pode ser a ligação elétrica, não o tamanho físico x16. Conferir as amostras e documentar a escolha.
- Os nomes e marcas mudam (GPU de "Nvidia GeForce RTX 4060" para "ASUS Dual RTX 4060…"). Os e2e usam fixture e não quebram, mas o teste de Índice 100 em `catalogo.test.ts` depende de as Peças de referência ainda existirem.
- Tarball de todo o OpenDB tem dezenas de MB; extrair só as 8 pastas e manter cache.
- Descarte em silêncio: todo `ok:false` precisa de motivo e entrar no relatório.

## Critério de pronto

- Todos os comportamentos acima com teste passando; `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` e `npm run test:e2e` verdes.
- `npm run pipeline` gera `public/dados/` válido, imprime o relatório e falha se algum ID antigo não resolver.
- Os 152 IDs antigos resolvem, os Desafios têm solução e o app abre e monta uma Build com os dados gerados (`npm run dev`).
