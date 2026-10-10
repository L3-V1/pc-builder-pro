# Como atualizar o Catálogo

> **Desde a Fase 11 os dados vêm de `npm run pipeline`.** `public/dados/` é gerado a partir do
> BuildCores OpenDB e da curadoria em `pipeline/curadoria/`; os preços e a Data de referência vêm
> de `pipeline/legado/` (o Catálogo de 2026-10 descrito abaixo). Não edite `public/dados/` à mão:
> veja a seção "Pipeline de specs" do README. Este guia será reescrito na Fase 15.

> Última atualização: Data de referência 2026-10, 152 Peças.

O Catálogo fica em `public/dados/`, um JSON por Categoria, mais `meta.json` com a Data de referência. O app busca esses arquivos por `fetch` (eles não entram no bundle) e os valida pelo schema (`src/catalogo/schema.ts`) ao carregar; os testes dos dados também os validam. Uma Peça inválida derruba o carregamento e o `npm test`.

## Regras que não podem ser quebradas

- **IDs não mudam nem somem.** Links compartilhados e soluções dos Desafios dependem deles. `src/catalogo/catalogo.test.ts` tem a lista fixa dos IDs anteriores à Fase 8. Ao retirar uma Peça de linha, mantenha-a no Catálogo com o último preço conhecido.
- O ID é um slug kebab-case que começa com a Categoria (`cpu-`, `placa-mae-`, `ram-`…). IDs novos levam marca e modelo (ex.: `ram-kingston-32gb-ddr5-6000`).
- **Peças novas entram no fim do JSON da Categoria.** A relevância da busca segue a ordem do Catálogo, e alguns testes pegam o primeiro resultado de um termo que hoje casa com mais de uma Peça (`vengeance 2x16`, `rtx 4060`).

## Passo a passo

1. **Data de referência.** Atualize `meta.json` (`AAAA-MM`) e a linha de "Última atualização" deste guia.
2. **Preços.** Para cada Peça, pesquise o preço à vista (PIX) do modelo mais comum na Kabum, na Pichau e na Terabyte. Quando as lojas divergem, use o preço típico, não a promoção relâmpago.
   - `medio` = preço típico, arredondado para múltiplo de 10 (ou de 50 acima de R$ 1.000);
   - `min = round(0,9 × medio)` e `max = round(1,12 × medio)`.
   Corrija também as Peças antigas: o Catálogo precisa ser coerente dentro da mesma Data de referência.
3. **Especificações.** Confira no site do fabricante os campos que alimentam regras: socket, `tipoRam`, `formFactor`, `slotsDimm`, `slotsM2`, `slotsPcieX16` (slots de tamanho físico x16), `portasSata`, `consumoW`, `fonteRecomendadaW`, `socketsSuportados` do cooler e `formFactorsSuportados` do gabinete.
4. **Índices de CPU e GPU.** Siga `docs/pontuacao.md`: escala fixa com 100 = Ryzen 7 9800X3D (CPU, Jogos), Ryzen 9 9950X (CPU, Produtividade) e RTX 5090 (GPU). Peça nova entra por proporção às que já existem. Se a referência do 100 mudar, reescale a coluna inteira. Atualize a tabela de `docs/pontuacao.md`.
5. **Rode `npm test`.** Os testes do Catálogo verificam:
   - schema e IDs (`validarCatalogo`);
   - de 140 a 160 Peças e pelo menos 12 por Categoria;
   - placa-mãe, CPU e cooler para cada socket; placa-mãe e RAM para cada tipo de RAM; placa-mãe e gabinete para cada form factor;
   - as Peças de referência com Índice 100 e a ordem de pares de referência;
   - os IDs anteriores à Fase 8.
6. **Desafios.** `src/desafios/solucoes.test.ts` confirma que cada Desafio tem solução dentro do Orçamento. Se os preços subirem, ajuste `orcamentoMaximo` em `src/desafios/dados/desafios.json` mantendo a folga original: Desafios "apertados" (Orçamento apertado, Escritório) ficam no custo da Build mais barata que os cumpre, arredondado para a centena acima; os outros ficam de 5% a 15% acima. As soluções de referência devem respeitar a fonte recomendada (sem alerta de fonte), mesmo que o Desafio não exija.
7. **Testes que leem o Catálogo real.** Só `src/catalogo/catalogo.test.ts` e `src/desafios/solucoes.test.ts` leem `public/dados/` (via `src/teste/dadosPublicados.ts`). Os testes de unidade, de componente e os e2e usam a fixture congelada `src/teste/catalogo.json` (os e2e interceptam `dados/*.json` com ela), então mudar preços ou incluir Peças não os quebra. Se um teste novo precisar de uma Peça que não está na fixture, copie-a do Catálogo real para a fixture, na mesma ordem relativa.
8. Rode `npm run lint` e `npm run typecheck`.

## Atualização de 2026-10 (Fase 8)

- De 42 para 152 Peças: CPU 24, GPU 24, placa-mãe 22, RAM 18, armazenamento 18, fonte 16, gabinete 16, cooler 14. Cobertura de AM4, AM5, LGA1700 e LGA1851, DDR4 e DDR5, e dos três form factors.
- Fontes: Kabum, Pichau, Terabyte e, quando o modelo estava sem oferta nelas, o agregador hardwarebarato.com e o Magazine Luiza. Várias cotações eram o último preço de produtos indisponíveis, e cerca de 20 preços foram estimados por equivalência (modelo parecido, mesma capacidade).
- A RAM e os SSDs subiram de 3 a 5 vezes em 2025–2026. Os preços de RAM e SSD das Peças anteriores foram corrigidos pelo preço dos modelos equivalentes pesquisados, e os Orçamentos de quatro Desafios subiram: Escritório (R$ 4.200), Gamer de entrada (R$ 5.000), Orçamento apertado (R$ 4.500) e Refrigeração de verdade (R$ 5.000).
- Os Índices das Peças novas são estimativas por proporção às Peças anteriores, não medições.
