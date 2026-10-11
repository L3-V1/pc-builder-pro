---
titulo: Coleta de preços no Mercado Livre
data: 2026-10-10
status: aprovado
---

# Plano: Coleta de preços no Mercado Livre

**Origem:** `docs/roadmap-pc-builder-pro.md`, Fase 12: Coleta de preços no Mercado Livre

## Objetivo

Hoje o `npm run pipeline` só publica as 152 Peças com par no Catálogo legado e usa as Faixas de preço legadas. Ao final desta fase, ele vai consultar Anúncios do Mercado Livre para um conjunto pré-selecionado de Peças do OpenDB e calcular a Faixa de preço do dia (mín, mediana, p90). Também vai publicar de 500 a 3.000 Peças e usar a data da coleta como Data de referência.

## Escopo

**Inclui:**
- Cliente OAuth com o token lido de variáveis de ambiente, mais uma ferramenta para obter o refresh token na primeira vez.
- Pré-seleção das Peças a consultar e consulta dos Anúncios de cada uma.
- Filtro de Anúncios, cálculo da Faixa de preço e montagem com as Peças novas.
- Relatório da coleta e testes com respostas gravadas da API.
- Ferramenta de amostragem para a conferência manual de 20 Peças.

**Não inclui:**
- O workflow agendado, a remoção de `public/dados/` do Git e a validação dos Desafios antes de publicar (Fase 13).
- A marca de "fora de venda" no schema e no app (Fases 13 e 14).
- O deploy no Pages, que ainda falta da Fase 8.

## Premissas

- O app no Mercado Livre ainda não existe. Criá-lo é um passo manual do usuário, guiado pelo plano (passo 1).
- O endpoint de Anúncios ainda precisa ser validado. Há relatos de 403 em `/sites/MLB/search` mesmo com token (veja [Reclame AQUI](https://www.reclameaqui.com.br/mercado-livre/erro-403-ao-acessar-endpoint-sitesmlbsearch-da-api-do-mercado-livre_04pHWaPgRpZGCIL2/)), enquanto `/products/search` responde. Por isso o passo 2 é um spike que define a estratégia, e o código isola a consulta atrás de uma porta.
- Nesta fase, uma Peça legada sem Anúncio válido continua no Catálogo com a Faixa legada e aparece no relatório (decisão do usuário). A Fase 13 troca isso por "fora de venda".
- Os segredos ficam em `.env.local`, que já está coberto pelo `*.local` do `.gitignore`. O pipeline lê esse arquivo com `process.loadEnvFile`.
- Nenhum filtro barato mede popularidade antes da coleta. Por isso o teto final por Categoria ordena as Peças pelo número de Anúncios válidos.

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Autenticação | `refresh_token` (authorization_code feito uma vez pela ferramenta `autorizar-ml.ts`). Se o spike mostrar que `client_credentials` acessa os endpoints, usar esse fluxo. | `client_credentials` não precisa de rotação, então tem prioridade se funcionar. Caso contrário, o refresh token é o caminho padrão do ML. |
| Fonte de Anúncios | Porta `BuscarAnuncios(consulta) → Anuncio[]`, com a implementação escolhida no spike: catálogo (`/products/search` → `/products/{id}/items`) ou busca (`/sites/MLB/search?condition=new`) | Isola o risco do 403 e permite gravar e reproduzir as respostas nos testes |
| Pré-seleção | `pipeline/curadoria/selecao.json` (Zod): marcas aceitas e teto de consultas por Categoria. CPU e GPU só entram com Índice curado. As 152 legadas sempre entram. | Reduz cerca de 21 mil Peças a algumas milhares de consultas, com dado curado e versionado como os Índices |
| Teto final | Por Categoria, as N Peças com mais Anúncios válidos, mais as legadas | Usa o número de Anúncios como sinal de popularidade e mantém o Catálogo entre 500 e 3.000 Peças |
| Filtro | Funções puras: condição nova, título contendo os tokens do modelo, sem palavras de kit/combo/usado, quantidade 1 e preço dentro de [0,5×, 2×] da mediana bruta. Exige no mínimo 3 Anúncios válidos (configurável). | É testável com respostas gravadas, e cada descarte registra um motivo, como já faz o normalizador |
| Estatística | mín = menor, médio = mediana, máx = percentil 90 (interpolação linear), arredondados para reais inteiros | Segue o GLOSSARY e o schema `FaixaPreco` (inteiros, mín ≤ médio ≤ máx) |
| Cache e limites | Respostas em `pipeline/.cache/ml/AAAA-MM-DD/`, concorrência limitada (ex.: 4), backoff exponencial em 429/5xx com no máximo 5 tentativas | Rodar de novo no mesmo dia não gasta requisições, e as execuções respeitam os limites da API |
| Modo sem coleta | `npm run pipeline -- --sem-coleta` reproduz o comportamento atual (só legadas, com preço legado) | Permite rodar sem token (CI, contribuidores), e a Fase 13 reaproveita |

## Arquivos afetados

- `pipeline/precos/token.ts` (novo): `obterToken(env): Promise<string>` troca o refresh token (ou client_credentials) por um access token. Se faltar variável, lança um erro claro.
- `pipeline/precos/cliente.ts` (novo): `criarClienteMl({ token, cacheDir, concorrencia })` faz `get(caminho)` com cache em disco, limite de concorrência e retry.
- `pipeline/precos/anuncios.ts` (novo): porta `BuscarAnuncios` e a implementação sobre o cliente. Converte a resposta para `Anuncio = { id, titulo, preco, condicao, quantidadeKit? }`.
- `pipeline/precos/consulta.ts` (novo): texto de busca da Peça (`marca + nome`; na GPU, marca da placa + nome) e os tokens obrigatórios no título.
- `pipeline/precos/filtro.ts` (novo): `filtrarAnuncios(normalizada, anuncios) → { validos, descartes: Record<motivo, n> }`.
- `pipeline/precos/faixa.ts` (novo): `calcularFaixa(precos, minimo) → FaixaPreco | null`.
- `pipeline/precos/selecao.ts` (novo): `selecionarCandidatas(normalizadas, selecao, indices, pareados)` e `aplicarTeto(precificadas, teto)`.
- `pipeline/precos/coletar.ts` (novo): orquestra seleção → consulta → filtro → faixa e devolve `Map<opendbId, { faixa, nAnuncios }>` mais o relatório da coleta.
- `pipeline/curadoria/selecao.json` + `pipeline/curadoria/schema.ts` (alterado): schema `Selecao`.
- `pipeline/montar.ts` (alterado): `EntradaMontagem` ganha `precos: Map<opendbId, Preco>` e `dataColeta`. Passa a montar as legadas (preço coletado, ou o legado com o motivo `precoLegado` no relatório) e as novas com preço. `RelatorioCategoria` ganha `comPreco`, `semAnuncio`, `descartesAnuncio` e `precoLegado[]`.
- `pipeline/main.ts` (alterado): carrega o `.env.local`, trata a flag `--sem-coleta`, chama `coletar` e imprime a tabela com as novas colunas.
- `pipeline/config.ts` (alterado): `ML_API`, caminho do cache do ML, mínimo de Anúncios e concorrência.
- `pipeline/ferramentas/autorizar-ml.ts` (novo): imprime a URL de autorização, troca o `code` e grava o `ML_REFRESH_TOKEN` no `.env.local`.
- `pipeline/ferramentas/amostrar-precos.ts` (novo): sorteia 20 Peças publicadas e imprime a Faixa e o link de busca no ML para conferência.
- `pipeline/teste/respostas-ml/*.json` (novo): respostas reais gravadas no spike, com kit, usado, outlier e modelo parecido.
- `.env.example` (novo), `README.md`, `CLAUDE.md` e `docs/roadmap-pc-builder-pro.md` (alterados): variáveis, a flag e o status da fase.
- `public/dados/*` (regenerado pelo pipeline, nunca editado à mão).

## Passos de implementação

1. **App no ML (manual, usuário):** criar o app em developers.mercadolivre.com.br com a redirect URI `https://localhost` e copiar o `client_id` e o `secret` para o `.env.local` (`ML_CLIENT_ID`, `ML_CLIENT_SECRET`).
2. **Spike da API:** escrever `token.ts` e `autorizar-ml.ts` e testar `client_credentials` contra `refresh_token` em `/products/search`, `/products/{id}/items` e `/sites/MLB/search` com 3 ou 4 Peças conhecidas (ex.: Ryzen 5 5600, RX 6600, Kingston A400). Gravar as respostas em `pipeline/teste/respostas-ml/` e anotar a estratégia escolhida e os limites observados no topo de `anuncios.ts`.
3. Implementar `faixa.ts` e `filtro.ts` com TDD sobre as respostas gravadas.
4. Implementar `consulta.ts` e `selecao.ts`, com o schema e o `selecao.json` inicial.
5. Implementar `cliente.ts` (cache, concorrência, retry) e `anuncios.ts` (a porta).
6. Implementar `coletar.ts` e integrar em `montar.ts`. Atualizar os testes de `montar.test.ts`: as legadas continuam resolvendo e as novas entram com preço.
7. Ajustar `main.ts` (`.env.local`, `--sem-coleta`, relatório) e `config.ts`.
8. Fazer uma execução real com `npm run pipeline`. Calibrar o `selecao.json` e o teto até o total ficar entre 500 e 3.000 Peças. Conferir `npm test` (dados publicados e soluções dos Desafios).
9. Rodar `amostrar-precos.ts` e conferir as 20 Peças com o usuário.
10. Atualizar a documentação e o roadmap.

## Comportamentos a testar

- [ ] `calcularFaixa` devolve `null` com menos Anúncios que o mínimo
- [ ] `calcularFaixa` devolve mín = menor preço, médio = mediana (par e ímpar), máx = p90, em reais inteiros
- [ ] a Faixa calculada sempre passa no schema `FaixaPreco` (mín ≤ médio ≤ máx)
- [ ] `filtrarAnuncios` descarta Anúncios usados e recondicionados com o motivo `usado`
- [ ] descarta título de kit, combo ou múltiplas unidades com o motivo `kit`
- [ ] descarta título sem os tokens do modelo (ex.: "RX 6600 XT" quando a Peça é RX 6600) com o motivo `modelo diferente`
- [ ] descarta outliers fora de [0,5×, 2×] da mediana bruta com o motivo `outlier`
- [ ] a consulta da GPU usa a marca da placa e o modelo, e a da CPU usa o nome sem a marca duplicada
- [ ] `selecionarCandidatas` exclui CPU e GPU sem Índice, exclui marcas fora da lista, respeita o teto de consultas e sempre inclui as legadas
- [ ] `aplicarTeto` mantém as N com mais Anúncios válidos por Categoria, além das legadas
- [ ] `obterToken` lança erro claro quando faltam variáveis de ambiente
- [ ] o cliente repete após 429 com backoff, desiste após o limite e lê do cache sem chamar o `fetch`
- [ ] a porta converte as respostas gravadas do ML em `Anuncio[]`
- [ ] `montarCatalogo` publica uma Peça nova com a Faixa coletada e o ID `categoria-marca-modelo`
- [ ] `montarCatalogo` deixa de fora uma Peça nova sem Anúncio válido e conta em `semAnuncio`
- [ ] `montarCatalogo` mantém a Peça legada sem Anúncio com a Faixa legada e a lista em `precoLegado`, e o alias continua resolvendo
- [ ] a Data de referência é a data da coleta (`AAAA-MM-DD`). No modo `--sem-coleta`, continua sendo a legada.
- [ ] as soluções dos Desafios continuam válidas com os dados publicados (`src/desafios/solucoes.test.ts`)

**Framework e comando de testes:** Vitest (`npx vitest run pipeline/precos`, `npm test`), mais `npm run typecheck` e `npm run lint`.

## Mapeamento com o roadmap

| Entregável da fase | Passos / testes que o cobrem |
|---|---|
| App OAuth e token por variáveis de ambiente | passos 1, 2 e 7; teste de `obterToken` |
| Busca de Anúncios descartando usados, kits e outliers, com mínimo de Anúncios | passos 3 a 5; testes de filtro, consulta, cliente e porta |
| Faixa mín/mediana/p90 e Data de referência = dia da coleta | passos 3 e 6; testes de `calcularFaixa` e da Data de referência |
| Peças sem Anúncios válidos ficam fora | passo 6; teste `semAnuncio` (legadas ficam com preço legado, por decisão) |
| Relatório da coleta | passos 6 e 7; campos novos em `relatorio.json` |
| Testes com respostas gravadas | passos 2 e 3; `pipeline/teste/respostas-ml/` |
| Critério de conclusão (500 a 3.000 Peças e amostragem de 20) | passos 8 e 9 |

## Riscos e pontos de atenção

- **Bloqueio da API:** se nenhum endpoint de Anúncios responder no spike, a fase para. Nesse caso, reavaliar com o usuário (ex.: outra fonte, ou reabrir o ADR 0003) antes de seguir.
- **Rotação do refresh token:** o ML pode invalidar o refresh token a cada uso. Localmente, a ferramenta regrava o `.env.local`. Na Fase 13, o secret do Actions vai precisar ser atualizado pelo workflow ou trocado por `client_credentials`.
- **Falsos positivos no casamento:** variantes como XT/Ti/Super, capacidades e kits de RAM 2×8 GB contra 1×16 GB. Os tokens obrigatórios e a amostragem manual mitigam, e cada caso que aparecer vira um teste com resposta gravada.
- **Desafios com Orçamento máximo:** os preços novos podem deixar uma solução cara demais. O `solucoes.test.ts` acusa o problema, e o ajuste da solução ou do Desafio é feito à mão, com o usuário.
- **Volume:** consultas × 2 requisições. O teto de consultas no `selecao.json` limita o gasto, e o cache diário evita repetir chamadas.

## Critério de pronto

- Todos os comportamentos acima com teste passando, e `npm run lint`, `npm run typecheck`, `npm run test:coverage` e `npm run build` verdes.
- `npm run pipeline` local gera de 500 a 3.000 Peças com a Data de referência do dia, e as 152 IDs antigos resolvem.
- A amostragem de 20 Peças confere com o Mercado Livre.
- O roadmap marca a Fase 12 como concluída.
