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

| Peça | Jogos | Produtividade | Vídeo integrado (J / P) |
|---|---|---|---|
| Ryzen 5 5600 | 62 | 26 | sem |
| Ryzen 5 7600 | 76 | 36 | 2 / 2 (Radeon 610M) |
| Ryzen 7 7800X3D | 89 | 43 | 2 / 2 (Radeon 610M) |
| Core i5-12400F | 66 | 29 | sem |
| Core i5-12400 | 66 | 29 | 2 / 2 (UHD 730) |
| Core i7-14700K | 82 | 83 | 3 / 3 (UHD 770) |
| GeForce RTX 3050 6 GB | 13 | 9 | |
| Radeon RX 6600 | 22 | 12 | |
| GeForce RTX 4060 | 26 | 20 | |
| Radeon RX 7800 XT | 42 | 28 | |
| GeForce RTX 4070 Super | 46 | 40 | |

Regras de coerência verificadas em `src/catalogo/catalogo.test.ts`: o 7800X3D supera o 5600 em Jogos, a RTX 4070 Super supera a RTX 3050 em Jogos, o i7-14700K supera o Ryzen 5 7600 em Produtividade, e todo vídeo integrado fica abaixo da GPU mais fraca em Jogos.

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

Com o Catálogo atual, que não tem GPU topo de linha, nenhuma Build real gera Gargalo de CPU. Os testes de fórmula usam Peças de fixture com Índices controlados, então recalibrar o Catálogo não os quebra.

## Como recalibrar

1. Atualize os Índices em `src/catalogo/dados/cpu.json` e `gpu.json`, e a tabela de fontes acima com a nova Data de referência.
2. Se a Peça de referência do 100 mudar, reescale todos os Índices da mesma coluna.
3. Ajuste pesos, limites ou penalidades só em `src/motor/pontuacao.ts` e atualize a tabela de constantes.
4. Rode `npm test`. Os testes de fórmula (`pontuacao.test.ts`) não dependem do Catálogo; o teste de coerência (`catalogo.test.ts`) aponta inversões entre Peças.

## Uso nos Desafios (Fase 7)

`calcularPontuacao` é a fonte da "Pontuação mínima por Perfil". Um Perfil `pendente` deve contar como não cumprido.
