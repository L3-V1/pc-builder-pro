# PC Builder Pro

Montador visual de PCs. Estado atual (Fase 3): busca de Peças, montagem por clique e painéis de Orçamento, Checklist e Alertas. Em memória: recarregar a página zera a Build.

## Como rodar

```bash
npm install
npm run dev        # servidor de desenvolvimento
npm test           # testes (Vitest)
npm run test:e2e   # testes de ponta a ponta (Playwright, Chromium; requer `npx playwright install chromium` uma vez)
npm run lint       # oxlint + prettier --check
npm run typecheck  # tsc -b
npm run build      # build de produção
npm run pipeline   # gera public/dados/ a partir do OpenDB (ver "Pipeline de specs")
```

## Catálogo

As peças ficam em `public/dados/<categoria>.json`, e a data de referência em `meta.json`. Elas
não entram no bundle: o app busca esses arquivos por `fetch` em `dados/*.json`, atrás de uma tela
de carregamento. O schema (Zod) está em `src/catalogo/schema.ts` e `carregarCatalogo()` valida
tudo ao carregar.

Os preços são **estimativas** em R$ (faixa mín, médio e máx), vindas do Catálogo anterior ao
pipeline enquanto não há coleta de preços.

## Pipeline de specs

`npm run pipeline` gera `public/dados/` a partir do [BuildCores OpenDB](https://github.com/buildcores/buildcores-open-db)
num commit fixado (`pipeline/config.ts`):

1. baixa o tarball do commit para `pipeline/.cache/` (reaproveitado nas próximas execuções);
2. normaliza cada Categoria para o schema do app, descartando registros com spec faltando ou fora
   do app (socket, form factor, DDR3, SO-DIMM, HDD…), sempre com um motivo;
3. junta a curadoria versionada em `pipeline/curadoria/`: Índices de CPU (por modelo) e de GPU
   (por chipset, com a fonte recomendada) e os pares "ID antigo → opendb_id";
4. aplica a Faixa de preço e a Data de referência do Catálogo antigo (`pipeline/legado/`): só
   entram Peças com par no legado e, se CPU ou GPU, com Índice;
5. grava os JSON por Categoria, `meta.json` e `aliases.json`.

Toda Peça tem ID `categoria-marca-modelo`. Os IDs antigos continuam valendo em links, Builds
salvas e Desafios pelo `aliases.json`, que o app consulta ao restaurar. O pipeline sai com código
diferente de zero, sem gravar nada, se algum ID antigo não resolve ou se a saída não passa no
schema. O resumo de descartes sai no console e o relatório completo em
`pipeline/.cache/relatorio.json`.

### Coleta de preços (em andamento)

Com `ML_CLIENT_ID` e `ML_CLIENT_SECRET` no `.env.local` (veja `.env.example`), o pipeline consulta
Anúncios do Mercado Livre e calcula a Faixa de preço do dia. Enquanto o app no Mercado Livre não
existe, deixe as duas vazias: o pipeline avisa e gera só as legadas com a Faixa de preço legada,
como descrito acima. O navegador nunca fala com o Mercado Livre; ele só lê `public/dados/`.

- `npm run pipeline -- --sem-coleta`: força o modo sem coleta mesmo com credenciais.
- `npm run pipeline -- --exigir-coleta`: falha em vez de cair no modo sem coleta (workflow agendado).

Para ligar uma Peça antiga a um registro do OpenDB, `npx tsx pipeline/ferramentas/sugerir-pares.ts [idAntigo…]`
lista os candidatos mais parecidos.

## Atribuição

As especificações das Peças vêm do [BuildCores OpenDB](https://github.com/buildcores/buildcores-open-db),
licenciado sob [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). O app mostra
essa atribuição no rodapé.
