# PC Builder Pro

Experiência interativa, em formato de jogo 2D, de montagem de um PC com peças reais do mercado brasileiro, com orçamento estimado em R$.

## Catálogo

**Peça**:
Um produto específico de hardware disponível no Catálogo (ex.: "Ryzen 5 7600").
_Avoid_: Componente, item, produto

**Categoria**:
O tipo funcional de uma Peça (CPU, placa-mãe, memória RAM, GPU, armazenamento, fonte, gabinete, cooler).
_Avoid_: Tipo, classe

**Catálogo**:
O conjunto curado de Peças oferecidas pelo app, com especificações e Faixa de preço.
_Avoid_: Banco de peças, inventário

**Faixa de preço**:
Os preços mínimo, médio e máximo observados para uma Peça em lojas brasileiras de referência.
_Avoid_: Preço (sozinho), cotação

**Data de referência**:
O mês em que as Faixas de preço do Catálogo foram levantadas.
_Avoid_: Data de atualização, última cotação

## Montagem

**Build**:
A configuração de PC que o usuário está montando: o conjunto de Peças encaixadas nos Slots da Bancada. Peças na Bandeja não fazem parte da Build.
_Avoid_: Montagem, configuração, setup, PC

**Bandeja**:
A área ao lado da Bancada que guarda Peças candidatas ou desencaixadas (ex.: após uma troca de placa-mãe), fora da Build.
_Avoid_: Carrinho, lista de desejos, inventário

**Bancada**:
A cena 2D onde o usuário arrasta Peças para os Slots e vê a Build tomar forma.
_Avoid_: Canvas, tela de montagem

**Slot**:
Um ponto de encaixe na Bancada que aceita Peças de uma Categoria (ex.: socket da CPU, slot DIMM, slot PCIe).
_Avoid_: Encaixe, vaga

**Incompatibilidade**:
Uma violação de regra entre Peças da Build. É **Bloqueante** quando é física (socket, tipo de RAM, form factor) e impede o encaixe; é um **Alerta** quando é de margem (ex.: fonte no limite) e apenas avisa.
_Avoid_: Erro, conflito

## Orçamento e jogo

**Orçamento**:
A soma das Faixas de preço das Peças da Build (somente as encaixadas), exibida como total médio e faixa mín–máx.
_Avoid_: Custo, total, preço da build

**Meta de orçamento**:
O teto em R$ que o usuário define para a Build.
_Avoid_: Limite, budget

**Checklist**:
A lista de Categorias que ainda faltam para a Build estar completa e poder "ligar".
_Avoid_: Progresso, pendências

**Índice de desempenho**:
Um número relativo, curado no Catálogo, que expressa a força de uma CPU ou GPU em um Perfil.
_Avoid_: Benchmark, score da peça

**Perfil**:
O uso para o qual a Build é avaliada: **Jogos** ou **Produtividade**.
_Avoid_: Modo, uso, cenário

**Pontuação**:
A estimativa de desempenho da Build em um Perfil, derivada dos Índices de desempenho e reduzida por Gargalos.
_Avoid_: Score, nota, benchmark

**Gargalo**:
Um desequilíbrio na Build (ex.: CPU fraca para a GPU, RAM insuficiente) que reduz a Pontuação.
_Avoid_: Bottleneck, limitação

**Desafio**:
Uma missão com objetivo e restrições (ex.: "PC gamer até R$ 4.000") que o usuário cumpre montando uma Build própria do Desafio, separada da Build livre.
_Avoid_: Missão, fase, nível
