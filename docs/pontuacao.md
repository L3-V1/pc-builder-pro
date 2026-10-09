# Pontuação de desempenho por Perfil

> Data de referência dos Índices: 2026-10 · Código: `src/motor/pontuacao.ts`

A Pontuação estima o desempenho da Build em dois Perfis, **Jogos** e **Produtividade**. Ela é derivada da Build (não é salva no localStorage nem no link) e vai de 0 a 100.

## Escala dos Índices

Cada CPU e GPU do Catálogo tem `indices: { jogos, produtividade }`, inteiros de 0 a 100. CPUs com vídeo integrado também têm `indiceVideoIntegrado`, que o schema exige quando, e somente quando, `videoIntegrado` é `true`.

O 100 é uma referência fixa de topo de mercado na Data de referência, não a melhor Peça do Catálogo. Por isso uma Peça do Catálogo pode ficar bem abaixo de 100.

| Índice | 100 equivale a | Medida |
|---|---|---|
| CPU, Jogos | Ryzen 7 9800X3D | Média de FPS em jogos a 1080p com GPU topo de linha |
| CPU, Produtividade | Ryzen 9 9950X | Cinebench R23 multi-core e Blender |
| GPU, Jogos | GeForce RTX 5090 | "Relative performance" em jogos a 1440p |
| GPU, Produtividade | GeForce RTX 5090 | Blender (render em GPU) |
| Vídeo integrado | Mesma escala da GPU | Comparação com GPUs de entrada |

As escalas de CPU e de GPU só são comparáveis entre si porque as duas usam "100 = topo de mercado". É essa comparação que o Gargalo de CPU usa.

## Fontes e valores

Os valores são calibrados à mão a partir de fontes públicas: médias de jogos a 1080p do TechPowerUp e do Tom's Hardware para CPUs, a tabela "relative performance" do TechPowerUp para GPUs, e Cinebench R23 multi e Blender Open Data para Produtividade. Eles são estimativas arredondadas, não medições próprias.

Os valores das Peças acrescentadas na Fase 8 foram estimados por proporção a partir das Peças que já existiam antes dela (Ryzen 5 5600, Ryzen 5 7600, Ryzen 7 7800X3D, Core i5-12400/12400F, Core i7-14700K e as cinco GPUs originais) e das diferenças relativas publicadas nessas fontes. Revise-os quando houver medições novas.

| CPU | Socket | Jogos | Produtividade | Vídeo integrado (J / P) |
|---|---|---|---|---|
| Ryzen 7 9800X3D | AM5 | 100 | 55 | 2 / 2 (Radeon 610M) |
| Ryzen 7 7800X3D | AM5 | 89 | 43 | 2 / 2 (Radeon 610M) |
| Core i9-14900K | LGA1700 | 85 | 91 | 3 / 3 (UHD 770) |
| Ryzen 9 9950X | AM5 | 83 | 100 | 2 / 2 (Radeon 610M) |
| Core i7-14700K | LGA1700 | 82 | 83 | 3 / 3 (UHD 770) |
| Ryzen 9 9900X | AM5 | 81 | 77 | 2 / 2 (Radeon 610M) |
| Core Ultra 9 285K | LGA1851 | 81 | 97 | 4 / 4 (Arc) |
| Ryzen 7 9700X | AM5 | 80 | 48 | 2 / 2 (Radeon 610M) |
| Ryzen 5 9600X | AM5 | 79 | 40 | 2 / 2 (Radeon 610M) |
| Core i5-14600KF | LGA1700 | 79 | 58 | sem |
| Core Ultra 7 265K | LGA1851 | 79 | 86 | 4 / 4 (Arc) |
| Ryzen 7 7700 | AM5 | 77 | 46 | 2 / 2 (Radeon 610M) |
| Ryzen 5 7600 | AM5 | 76 | 36 | 2 / 2 (Radeon 610M) |
| Ryzen 7 5700X3D | AM4 | 74 | 31 | sem |
| Core Ultra 5 245K | LGA1851 | 74 | 61 | 4 / 4 (Arc) |
| Core i5-14400F | LGA1700 | 70 | 43 | sem |
| Ryzen 5 8600G | AM5 | 68 | 35 | 8 / 8 (Radeon 760M) |
| Core i5-12400F | LGA1700 | 66 | 29 | sem |
| Core i5-12400 | LGA1700 | 66 | 29 | 2 / 2 (UHD 730) |
| Ryzen 7 5700X | AM4 | 66 | 33 | sem |
| Ryzen 5 5600 | AM4 | 62 | 26 | sem |
| Ryzen 5 5500 | AM4 | 57 | 24 | sem |
| Ryzen 5 5600G | AM4 | 55 | 25 | 5 / 5 (Vega 7) |
| Core i3-12100F | LGA1700 | 55 | 20 | sem |

| GPU | Jogos | Produtividade |
|---|---|---|
| GeForce RTX 5090 | 100 | 100 |
| GeForce RTX 5080 | 66 | 64 |
| GeForce RTX 5070 Ti | 58 | 55 |
| Radeon RX 7900 XTX | 58 | 38 |
| Radeon RX 9070 XT | 56 | 37 |
| Radeon RX 9070 | 52 | 33 |
| GeForce RTX 5070 | 48 | 44 |
| GeForce RTX 4070 Super | 46 | 40 |
| Radeon RX 7900 GRE | 45 | 31 |
| Radeon RX 7800 XT | 42 | 28 |
| GeForce RTX 4070 | 40 | 34 |
| Radeon RX 7700 XT | 37 | 23 |
| GeForce RTX 5060 Ti 16 GB | 36 | 30 |
| Radeon RX 9060 XT 16 GB | 35 | 17 |
| Radeon RX 9060 XT 8 GB | 34 | 16 |
| GeForce RTX 4060 Ti 8 GB | 32 | 25 |
| GeForce RTX 5060 | 31 | 24 |
| Arc B580 | 28 | 14 |
| GeForce RTX 4060 | 26 | 20 |
| Radeon RX 7600 | 25 | 10 |
| GeForce RTX 5050 | 24 | 17 |
| GeForce RTX 3060 12 GB | 23 | 17 |
| Radeon RX 6600 | 22 | 12 |
| GeForce RTX 3050 6 GB | 13 | 9 |

Regras de coerência verificadas em `src/catalogo/catalogo.test.ts`:

- as Peças de referência do 100 estão no Catálogo com 100: Ryzen 7 9800X3D (CPU, Jogos), Ryzen 9 9950X (CPU, Produtividade) e RTX 5090 (GPU, os dois Perfis);
- pares de referência mantêm a ordem esperada, por exemplo 9800X3D > 7800X3D > 9700X em Jogos, 9950X > Core Ultra 9 285K > Core Ultra 5 245K em Produtividade, RTX 5090 > RTX 5080 > RTX 5070 Ti, RX 9070 XT > RTX 5070 e RTX 5060 > RTX 4060 em Jogos;
- todo vídeo integrado fica abaixo da GPU mais fraca em Jogos.

## Fórmula

1. **Vídeo.** Usa a GPU encaixada. Sem GPU, usa o `indiceVideoIntegrado` da CPU. Sem CPU, os dois Perfis ficam pendentes ("Encaixe uma CPU"). Com CPU sem vídeo integrado e sem GPU, ficam pendentes ("Encaixe uma GPU").
2. **Base.** Média ponderada:
   - Jogos = 0,3 × CPU + 0,7 × vídeo
   - Produtividade = 0,7 × CPU + 0,3 × vídeo
3. **Gargalos.** Penalidades multiplicativas, `base × Π(1 − p)`, aplicadas na ordem CPU e depois RAM.
   - **CPU** (só em Jogos e só com GPU dedicada): quando `GPU − CPU > 20`, a penalidade é de 1 ponto percentual por ponto acima de 20, com teto de 30%.
   - **RAM** (soma de `capacidadeTotalGB` de todos os kits; mínimo de 16 GB em Jogos e 32 GB em Produtividade):
     - sem RAM: −50%;
     - 8 GB ou menos: −30%;
     - abaixo do mínimo do Perfil: −15%.
4. **Arredondamento.** O valor final e a base são arredondados para inteiro. Como os pesos somam 1 e cada penalidade fica entre 0 e 1, o valor fica sempre entre 0 e 100.

Cada Gargalo guarda o percentual aplicado e os pontos perdidos naquele passo (o valor arredondado antes menos o valor arredondado depois), para o painel explicar a penalidade.

## Constantes

Todas ficam em `src/motor/pontuacao.ts`:

| Constante | Valor | Uso |
|---|---|---|
| `PESOS` | Jogos 0,3 / 0,7 · Produtividade 0,7 / 0,3 | Peso de CPU e vídeo na base |
| `LIMITE_GARGALO_CPU` | 20 | Diferença de Índice tolerada antes do Gargalo de CPU |
| `TETO_GARGALO_CPU` | 0,3 | Penalidade máxima do Gargalo de CPU |
| `RAM_MINIMA_GB` | Jogos 16 · Produtividade 32 | Capacidade recomendada por Perfil |
| `RAM_CRITICA_GB` | 8 | Até essa capacidade, a RAM recebe a penalidade crítica |
| `PENALIDADES_RAM` | sem RAM 0,5 · crítica 0,3 · abaixo do mínimo 0,15 | Penalidades do Gargalo de RAM |

## Exemplos

**Build do e2e** (Ryzen 5 7600, RTX 4060, 32 GB):
- Jogos = 0,3 × 76 + 0,7 × 26 = 41,0 → **41**, sem Gargalos.
- Produtividade = 0,7 × 36 + 0,3 × 20 = 31,2 → **31**, sem Gargalos.

**A mesma Build com 16 GB:** Jogos continua 41. Produtividade = 31,2 × 0,85 = 26,52 → **27** ("Pouca RAM para produtividade (16 GB, o recomendado é 32 GB): −15%." Perde 4 pontos).

**Gargalo de CPU** (fixture: CPU 40, GPU 80 em Jogos, 12 GB): base = 0,3 × 40 + 0,7 × 80 = 68. A diferença 40 passa o limite em 20, então a penalidade é de 20% (68 → 54,4, perde 14). 12 GB fica abaixo dos 16 GB de Jogos: −15% (54,4 → 46,24, perde 8). Resultado: **46**.

Com a RTX 5090 no Catálogo, Builds reais já geram Gargalo de CPU: com um Ryzen 5 5500 (57), a diferença em Jogos é 43, e a penalidade chega a 23%. Os testes de fórmula usam Peças de fixture com Índices controlados, então recalibrar o Catálogo não os quebra.

## Como recalibrar

1. Atualize os Índices em `src/catalogo/dados/cpu.json` e `gpu.json`, e a tabela de fontes acima com a nova Data de referência.
2. Se a Peça de referência do 100 mudar, reescale todos os Índices da mesma coluna.
3. Ajuste pesos, limites ou penalidades só em `src/motor/pontuacao.ts` e atualize a tabela de constantes.
4. Rode `npm test`. Os testes de fórmula (`pontuacao.test.ts`) não dependem do Catálogo; o teste de coerência (`catalogo.test.ts`) aponta inversões entre Peças.

## Uso nos Desafios (Fase 7)

`calcularPontuacao` é a fonte da "Pontuação mínima por Perfil". Um Perfil `pendente` deve contar como não cumprido.
