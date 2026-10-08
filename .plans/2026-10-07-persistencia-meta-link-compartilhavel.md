---
titulo: Persistência, Meta de orçamento e link compartilhável
data: 2026-10-07
status: aprovado
---

# Plano: Persistência, Meta de orçamento e link compartilhável

**Origem:** `docs/roadmap-pc-builder-pro.md`, Fase 5: Persistência, Meta e compartilhamento

## Objetivo

Hoje a Build e a Bandeja existem só na memória do `useReducer` e se perdem ao recarregar a página. Nesta fase:

- a Build, a Bandeja e a Meta passam a ser salvas no localStorage;
- o usuário ganha um campo de Meta de orçamento com uma barra que mostra quanto falta ou quanto passou;
- a Build pode ser compartilhada por um link no hash da URL.

Ao abrir um link, as Peças são buscadas no Catálogo atual (os preços são recalculados) e o app avisa quando alguma Peça não existe mais.

## Escopo

**Inclui:**
- Codificar e decodificar o link (função pura e tolerante a entradas inválidas).
- Montar a Build a partir de uma lista de IDs, usando o motor e encaixando a placa-mãe primeiro.
- Salvar e restaurar o estado no localStorage com schema Zod versionado, guardando só IDs.
- `meta` no `EstadoBuild` e as novas ações `definir-meta` e `substituir`.
- Situação da Meta como função pura e o componente `PainelMeta` (campo e barra).
- Botão "Copiar link", com mensagem de sucesso e uma alternativa quando a área de transferência falha.
- Testes de unidade, de componente e e2e (recarregar a página e abrir o link em outra aba).

**Não inclui:**
- Meta travada por Desafio e Build separada do Desafio (Fase 7). O formato salvo já prevê isso com `versao`.
- Encurtador de link, QR code e compartilhamento nativo (`navigator.share`).
- Sincronizar entre abas abertas ao mesmo tempo (evento `storage`): vale a última aba que salvar.
- Pontuação (Fase 6).

## Decisões confirmadas com o usuário

- **Formato do link:** hash legível, `#b=<id>,<id>*<n>,...&m=<reais>`. Os IDs do Catálogo só têm `[a-z0-9-]`, então não precisam de escape.
- **Abrir um link com Build local diferente:** o link substitui a Build e a Meta. As Peças da Build anterior vão para a Bandeja, um aviso informa a troca e o hash é removido com `history.replaceState`, para que recarregar não aplique o link de novo.
- **Meta:** a barra compara com o **total médio**. Quando o médio cabe na Meta mas o máximo passa dela, aparece a nota "No preço máximo, pode passar em até R$ X".
- **O link leva só a Build e a Meta.** A Bandeja fica apenas no localStorage.

## Premissas

- **Quantidades:** `id*n` agrupa Peças repetidas (RAM e armazenamento). `n` é um inteiro de 2 a 8. Um token sem `*` vale 1. Tokens malformados (`*0`, `*x`, `*99`, caracteres fora de `[a-z0-9-]`) são ignorados e contados como inválidos.
- **Meta válida:** inteiro em reais, de 1 a 1.000.000. No link, um `m` inválido é ignorado. No campo, o texto aceita pontos de milhar ("5.000") e o vazio remove a Meta. Um valor inválido mostra a mensagem em pt-BR "Informe um valor inteiro em reais, de R$ 1 a R$ 1.000.000" e não altera a Meta.
- **Hash sem `b` nem `m` válidos** (ex.: `#sobre`) não é tratado como link e é ignorado.
- **Remontar a partir de IDs** (link ou localStorage): resolve cada ID no Catálogo e ordena por Categoria (placa-mãe, CPU, cooler, RAM, armazenamento, GPU, fonte, gabinete). Depois encaixa uma Peça por vez com o `encaixar` do motor. O que for bloqueado, desalojado ou depender de placa-mãe sem placa vai para a Bandeja. Os IDs desconhecidos são contados.
- **Avisos** usam o `aviso` atual (`role="status"`):
  - link aplicado: "Build do link carregada.", mais " A Build anterior foi para a Bandeja." quando havia Peças e a Build anterior era diferente;
  - IDs desconhecidos: " 1 Peça do link não existe mais no Catálogo." / " N Peças do link não existem mais no Catálogo.";
  - recusadas: " N Peças foram para a Bandeja.";
  - no localStorage, IDs desconhecidos geram "N Peças salvas não existem mais no Catálogo.".
- **localStorage:** chave `pc-builder-pro:estado`, valor `{ versao: 1, build: string[], bandeja: string[], meta?: number }`. JSON inválido, schema inválido ou acesso que lança exceção (modo privado, cota cheia) fazem o app começar vazio, sem quebrar. As chaves da Bandeja são geradas de novo na restauração.
- **Quando salvar:** um `useEffect` em `App` salva sempre que `build`, `bandeja` ou `meta` mudam. Sem debounce, porque o volume é pequeno.
- **Inicialização:** a inicialização preguiçosa do `useReducer` chama `iniciarEstado({ salvo, hash, catalogo })`. Essa função restaura o estado salvo e, se houver link, aplica a ação `substituir`. Um ouvinte de `hashchange` trata o link colado na mesma aba.
- **Copiar link:** o botão fica desabilitado com a Build vazia e sem Meta. Ele monta `location.origin + location.pathname + '#' + codificarLink(...)` e chama `navigator.clipboard.writeText`. Em caso de sucesso, o aviso diz "Link copiado". Em caso de falha, um campo somente leitura mostra o link já selecionado, com o texto "Copie o link abaixo".
- **Barra da Meta:** elemento com `role="meter"`, `aria-valuenow` e `aria-valuemax`, preenchimento limitado a 100% e a cor de perigo quando passa do teto. Os textos são "Faltam R$ X para a Meta", "R$ X acima da Meta" e "Exatamente na Meta". Sem Meta, a barra não aparece.

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Onde fica a lógica | Novo módulo `src/persistencia/` (`link.ts`, `remontar.ts`, `armazenamento.ts`), todo puro, e `src/motor/meta.ts` | Mesmo padrão de `motor`/`busca`/`bancada`: regra testável em node, componentes finos |
| Hash em vez de query | `#b=...&m=...` | Escolha do usuário. Funciona em qualquer host estático e não vai para o servidor |
| O que é salvo | Só IDs | Preços sempre recalculados pelo Catálogo atual (o roadmap pede isso) e o formato continua pequeno |
| Validação do salvo | Schema Zod com `versao: z.literal(1)` | O Zod já está no projeto e a versão abre espaço para a Fase 7 |
| Acesso ao navegador | `armazenamento.ts` recebe um `Pick<Storage, 'getItem' \| 'setItem'>` injetado | Dá para testar em node com um storage falso e simular exceções |
| Aplicar link | Ação `substituir` no reducer, com as Peças já resolvidas | Mesma lógica para a carga inicial e para o `hashchange`, e o reducer continua puro, sem acessar o Catálogo |

### Contratos novos e alterados

```ts
// src/persistencia/link.ts
export type DadosLink = { ids: string[]; meta?: number; invalidos: number }
export function codificarLink(ids: readonly string[], meta?: number): string // sem '#'
export function decodificarLink(hash: string): DadosLink | undefined // aceita com ou sem '#'

// src/persistencia/remontar.ts
export type Remontagem = { build: Build; recusadas: Peca[]; desconhecidos: string[] }
export function resolverIds(ids: readonly string[], pecas: readonly Peca[]): { pecas: Peca[]; desconhecidos: string[] }
export function remontarBuild(pecas: readonly Peca[]): { build: Build; recusadas: Peca[] }

// src/persistencia/armazenamento.ts
export const CHAVE_ESTADO = 'pc-builder-pro:estado'
export type EstadoSalvo = { versao: 1; build: string[]; bandeja: string[]; meta?: number }
export function serializarEstado(estado: EstadoBuild): EstadoSalvo
export function lerEstadoSalvo(storage: Pick<Storage, 'getItem'>): EstadoSalvo | undefined
export function salvarEstado(storage: Pick<Storage, 'setItem'>, estado: EstadoBuild): void // engole exceções

// src/persistencia/iniciar.ts
export function iniciarEstado(entrada: { salvo?: EstadoSalvo; hash: string; catalogo: Catalogo }): EstadoBuild

// src/motor/meta.ts
export type SituacaoMeta =
  | { tipo: 'dentro'; falta: number; percentual: number; excessoNoMaximo?: number }
  | { tipo: 'acima'; excesso: number; percentual: number }
export function situacaoMeta(orcamento: FaixaPreco, meta: number): SituacaoMeta
export function interpretarMeta(texto: string): { ok: true; valor?: number } | { ok: false }

// src/estado/build.ts (alterado)
export type EstadoBuild = { build; bandeja; proximaChave; meta?: number; aviso? }
export type AcaoBuild =
  | ... // as quatro atuais
  | { tipo: 'definir-meta'; valor?: number }
  | { tipo: 'substituir'; pecas: Peca[]; meta?: number; desconhecidos: number }
  | { tipo: 'avisar'; texto: string; tom: 'info' | 'erro' } // "Link copiado"
```

## Arquivos afetados

- `src/persistencia/link.ts`, `remontar.ts`, `armazenamento.ts`, `iniciar.ts`, `index.ts` (novos), cada um com o seu `.test.ts`.
- `src/motor/meta.ts` e `meta.test.ts` (novos), exportados em `src/motor/index.ts`.
- `src/estado/build.ts` e `build.test.ts` (alterados): `meta`, `definir-meta`, `substituir`, `avisar`. `avisar` passa a ser reaproveitado.
- `src/componentes/PainelMeta.tsx`, `PainelMeta.css` e `PainelMeta.test.tsx` (novos): campo e barra. Usa `formatarReais` de `src/componentes/formatar.ts`.
- `src/componentes/BotaoCompartilhar.tsx` e `BotaoCompartilhar.test.tsx` (novos).
- `src/App.tsx` e `App.test.tsx` (alterados): inicialização preguiçosa, efeito de salvar, `hashchange` + `replaceState`, e `PainelMeta`/`BotaoCompartilhar` na coluna lateral, logo abaixo do `PainelOrcamento`.
- `src/teste/setup.ts` (alterado): `localStorage.clear()` e limpeza do hash em `afterEach`.
- `e2e/persistencia.spec.ts` (novo).
- `docs/roadmap-pc-builder-pro.md` (alterado no fim): marcar os entregáveis e o status.

## Passos de implementação

1. `link.ts`: `codificarLink` e `decodificarLink`, com agrupamento `id*n`, limites e tolerância a erros.
2. `remontar.ts`: `resolverIds` e `remontarBuild`, com ordem por Categoria e recusadas indo para a Bandeja.
3. `motor/meta.ts`: `situacaoMeta` e `interpretarMeta`.
4. Reducer: `meta`, `definir-meta`, `avisar` e `substituir`. A ação `substituir` manda a Build anterior para a Bandeja quando ela é diferente, remonta, guarda as recusadas e compõe o aviso.
5. `armazenamento.ts`: schema Zod, `serializarEstado`, `lerEstadoSalvo` e `salvarEstado`.
6. `iniciar.ts`: `iniciarEstado` restaura o estado salvo (Build remontada, Bandeja e Meta) e aplica o link, se houver.
7. `PainelMeta` e `BotaoCompartilhar`.
8. `App`: ligar a inicialização, o efeito de salvar, o `hashchange` (decodificar, resolver, despachar `substituir` e limpar o hash) e os painéis novos.
9. Ajustar `src/teste/setup.ts` e escrever `e2e/persistencia.spec.ts`.
10. Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:coverage` e `npm run test:e2e`, e atualizar o roadmap.

## Comportamentos a testar

**Link (`link.test.ts`)**
- [ ] Ida e volta: `decodificarLink(codificarLink(ids, meta))` devolve os mesmos IDs, na mesma ordem e quantidade, e a mesma Meta.
- [ ] IDs repetidos viram `id*n`, e `id*2` decodifica em dois IDs.
- [ ] Sem Meta, o link não tem `m`, e só com Meta tem `m` sem `b`.
- [ ] Aceita o hash com ou sem `#`.
- [ ] Os tokens `*0`, `*x`, `*99`, vazio e com maiúsculas ou caracteres inválidos são ignorados e somados em `invalidos`.
- [ ] `m` negativo, zero, decimal, não numérico ou acima de 1.000.000 é ignorado.
- [ ] Hash vazio ou sem `b` e `m` (ex.: `#sobre`) retorna `undefined`.
- [ ] Parâmetros desconhecidos são ignorados.

**Remontagem (`remontar.test.ts`)**
- [ ] `resolverIds` separa os IDs conhecidos dos desconhecidos e preserva as repetições.
- [ ] `remontarBuild` encaixa a placa-mãe antes, mesmo quando ela vem por último na lista.
- [ ] CPU LGA1700 com placa AM5 vai para `recusadas`.
- [ ] CPU sem placa-mãe vai para `recusadas`, enquanto gabinete e fonte entram.
- [ ] Três kits de 2 módulos numa placa com 4 DIMMs: dois entram e um vai para `recusadas`.
- [ ] Duas CPUs na lista: a última fica e a outra vai para `recusadas`.

**Meta (`meta.test.ts`)**
- [ ] Médio abaixo da Meta resulta em `dentro`, com `falta` e `percentual` corretos.
- [ ] Médio acima da Meta resulta em `acima`, com `excesso`.
- [ ] Médio igual à Meta resulta em `dentro`, com `falta = 0`.
- [ ] Médio dentro e máximo acima da Meta preenchem `excessoNoMaximo = max − meta`, e ele não aparece quando o máximo cabe.
- [ ] `interpretarMeta("5.000")` resulta em 5000, `""` em `ok` sem valor, e `"abc"`, `"0"`, `"-5"`, `"10,5"` e `"2000000"` são inválidos.

**Reducer (`estado/build.test.ts`)**
- [ ] `definir-meta` grava e remove a Meta sem mexer na Build.
- [ ] `substituir` com a Build atual vazia monta a Build do link, define a Meta, não altera a Bandeja e avisa "Build do link carregada.".
- [ ] `substituir` com Build diferente manda as Peças antigas para a Bandeja e o aviso menciona a Bandeja.
- [ ] `substituir` com a mesma Build não duplica as Peças na Bandeja.
- [ ] `substituir` com `desconhecidos: 2` avisa "2 Peças do link não existem mais no Catálogo.".
- [ ] `substituir` com uma Peça bloqueada a manda para a Bandeja.
- [ ] `substituir` sem `meta` mantém a Meta atual. Premissa: um link só com a Build não apaga o teto do usuário.

**Armazenamento (`armazenamento.test.ts`)**
- [ ] `serializarEstado` guarda os IDs da Build (com repetições), os IDs da Bandeja e a Meta.
- [ ] `lerEstadoSalvo` devolve `undefined` para chave ausente, JSON inválido, `versao` diferente ou formato errado.
- [ ] `lerEstadoSalvo` devolve `undefined` quando `getItem` lança exceção, e `salvarEstado` não propaga a exceção de `setItem`.

**Inicialização (`iniciar.test.ts`)**
- [ ] Sem estado salvo e sem hash, o resultado é o `ESTADO_INICIAL`.
- [ ] Com estado salvo, Build, Bandeja e Meta são restauradas, com preços do Catálogo atual e chaves novas na Bandeja.
- [ ] Um estado salvo com ID que sumiu do Catálogo restaura o resto e avisa.
- [ ] Hash com link sobre um estado salvo diferente: a Build e a Meta vêm do link, e a Build salva vai para a Bandeja.

**Componentes (jsdom)**
- [ ] `PainelMeta` sem Meta mostra o campo vazio e nenhum `meter`.
- [ ] Digitar "5.000" e confirmar (blur ou Enter) chama `onDefinirMeta(5000)`.
- [ ] Um valor inválido mostra a mensagem pt-BR e não chama `onDefinirMeta`.
- [ ] Com Meta e Orçamento abaixo, aparecem "Faltam R$ X para a Meta" e o `meter` com `aria-valuenow`. Acima, aparece "R$ X acima da Meta". Quando o máximo passa, aparece a nota do máximo.
- [ ] `BotaoCompartilhar` desabilitado com Build vazia e sem Meta.
- [ ] O clique escreve o link esperado em `navigator.clipboard` (mock) e chama `onCopiado`.
- [ ] Quando o clipboard rejeita, o campo somente leitura aparece com o link.
- [ ] `App`: depois de adicionar a placa e a CPU, o localStorage contém os IDs.
- [ ] `App`: renderizar com um estado salvo no localStorage mostra a Build restaurada.
- [ ] `App`: renderizar com `#b=...&m=...` aplica o link, mostra o aviso e limpa o hash.

**E2E (`e2e/persistencia.spec.ts`)**
- [ ] Montar a Build, guardar uma Peça na Bandeja, definir a Meta e recarregar: Build, Bandeja, Meta e Orçamento continuam iguais.
- [ ] Copiar o link (com permissão de clipboard) e abri-lo em outra página de um contexto novo reproduz a mesma Build, o mesmo Orçamento e a mesma Meta (critério da fase).
- [ ] Abrir um link com um ID inexistente mostra o aviso de Peça que não existe mais e monta o resto.
- [ ] Depois de abrir um link, a URL fica sem hash e recarregar mantém a Build sem repetir o aviso.

**Framework e comando de testes:** Vitest + Testing Library (`npm test`, componentes com `// @vitest-environment jsdom`) e Playwright (`npm run test:e2e`).

## Mapeamento com o roadmap

| Entregável da fase | Passos / testes que o cobrem |
|---|---|
| Build e Bandeja salvas no localStorage e restauradas | Passos 5, 6, 8; testes de Armazenamento, Inicialização, `App` e e2e de recarregar |
| Campo de Meta com barra de falta ou excesso | Passos 3, 4, 7; testes de Meta, Reducer e `PainelMeta` |
| Link com IDs, quantidades e Meta, com preços recalculados | Passos 1, 2, 4, 7, 8; testes de Link, Remontagem, `BotaoCompartilhar` e e2e do link |
| Aviso de Peças que não existem mais | Passos 2, 4; testes de `substituir`, Inicialização e e2e de ID inexistente |
| Testes de codificar e decodificar, incluindo IDs inválidos | Passo 1; bloco Link |

## Riscos e pontos de atenção

- **Renomear IDs do Catálogo quebra links antigos.** O aviso cobre esse caso, mas o guia da Fase 8 (`docs/atualizar-catalogo.md`) deve dizer para não renomear IDs.
- **jsdom e localStorage:** o estado persiste entre os testes do mesmo arquivo. Por isso entra o `localStorage.clear()` em `afterEach`.
- **Clipboard no Playwright:** precisa de `context.grantPermissions(['clipboard-read', 'clipboard-write'])` no Chromium. Como alternativa, o e2e pode ler o link do campo de fallback.
- **StrictMode** chama o inicializador duas vezes no dev. `iniciarEstado` é puro e o `replaceState` fica no efeito, então não há efeito duplicado visível.
- **Fase 7** vai precisar de uma Build de Desafio separada. Uma chave própria ou `versao: 2` resolvem isso sem migração agora.

## Critério de pronto

- Todos os comportamentos acima com teste passando: `npm test`, cobertura do motor ≥ 90% e `npm run test:e2e` verdes.
- `npm run lint` e `npm run typecheck` sem erros.
- Critério da fase atendido: um link copiado e aberto em outra aba reproduz a mesma Build e a mesma Meta.
- Roadmap com os entregáveis da Fase 5 marcados.
