# Catálogo gerado por pipeline a partir de fontes externas

O Catálogo deixa de ser JSON curado dentro do repositório. Um job diário no GitHub Actions monta os dados: baixa as especificações do BuildCores OpenDB, junta os Índices de desempenho curados (o único dado mantido à mão), coleta Anúncios no Mercado Livre para calcular as Faixas de preço e publica `/dados/*.json` apenas no artefato do GitHub Pages, sem commit. O app continua 100% frontend: carrega os dados por `fetch` ao abrir e busca de forma assíncrona (debounce e cancelamento) sobre eles. Queríamos um Catálogo maior e preços frescos sem servidor em runtime. Nenhuma API com preço em R$ aceita chamadas do navegador sem chave secreta, então a coleta ficou no cron, onde as credenciais viram secrets.

## Considered Options

- **Preço ao vivo via proxy serverless (Cloudflare Worker):** rejeitado para manter o app sem servidor em runtime. O cron entrega preços com até 24h de atraso.
- **Chamar o Mercado Livre direto do navegador:** a busca anônima retorna 403 desde 2025, e o OAuth exige um segredo ou login do usuário.
- **Lomadee, Awin e SerpApi:** usam chave secreta e não enviam CORS. A Lomadee exige cadastro de afiliado.
- **docyx/pc-part-dataset:** desatualizado, com preços em USD, dados raspados do PCPartPicker e CPU sem socket.

## Consequences

- A licença CC BY-NC-SA do OpenDB impede uso comercial e exige atribuição. Os dados derivados herdam a licença.
- Só entram no Catálogo Peças com Anúncios válidos e, para CPU e GPU, com Índice curado.
- Peças que deixam de ter Anúncios viram Peças fora de venda: continuam nos dados com a última Faixa de preço, para que links e Builds salvas remontem. Os IDs do Catálogo antigo são preservados por uma tabela de aliases.
- O pipeline valida as soluções dos Desafios com Peças à venda e não publica se alguma deixar de existir.
- Testes deixam de ler o Catálogo real e passam a usar fixtures.
