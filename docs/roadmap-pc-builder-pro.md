# Roadmap: PC Builder Pro

> Criado em 2026-10-06 · Última atualização 2026-10-10

## Visão geral

O PC Builder Pro é uma aplicação web em que o usuário monta um PC como num jogo 2D. Ele pesquisa Peças reais do mercado brasileiro e as arrasta para os Slots de uma Bancada interativa. Enquanto monta, o app valida a compatibilidade entre as Peças, calcula o Orçamento estimado em R$ e a Pontuação de desempenho, e propõe Desafios. O público são entusiastas e iniciantes que querem planejar um PC sem planilhas nem dúvidas de compatibilidade.

## Objetivo final

Uma aplicação estática publicada, em pt-BR, que funciona no desktop e no celular, com um Catálogo de 500 a 3.000 Peças gerado diariamente a partir de fontes externas (specs do OpenDB, preços do Mercado Livre) e carregado por fetch, Bancada 2D com arrastar e soltar, Orçamento com faixa de preço, Pontuação por Perfil, Desafios, Builds compartilháveis por link, busca assíncrona e funcionamento offline.

## Premissas e restrições

- Vocabulário do domínio definido em `GLOSSARY.md`. Decisões de arquitetura em `docs/adr/` (0001: Catálogo estático sem backend, substituído pelo 0003; 0002: Bancada em SVG/DOM; 0003: Catálogo gerado por pipeline a partir de fontes externas).
- Stack: React, TypeScript e Vite. Arrastar e soltar com dnd-kit, animações com Framer Motion, schema do Catálogo com Zod.
- Não há backend nem servidor em runtime: o app é 100% frontend no GitHub Pages. A Build fica salva no localStorage e é compartilhada por URL com os IDs das Peças e a Meta.
- Fases 1 a 8: Catálogo em JSON versionado no repositório, com preços atualizados à mão.
- A partir da Fase 9 (ADR 0003): um pipeline diário no GitHub Actions gera o Catálogo e publica `/dados/*.json` só no artefato do Pages, sem commit. Specs vêm do BuildCores OpenDB (CC BY-NC-SA, com atribuição; o projeto não é comercial). Faixas de preço vêm de Anúncios do Mercado Livre (mín = menor Anúncio válido, médio = mediana, máx = percentil 90). A Data de referência é o dia da coleta. Só os Índices de desempenho, a tabela de aliases de IDs e os Desafios continuam curados no repositório.
- O app carrega o Catálogo inteiro atrás de uma tela de carregamento. Depois disso, motor, persistência e Desafios continuam síncronos. Só a busca passa por uma porta assíncrona.
- Chaves de API nunca vão para o bundle. O token do Mercado Livre fica nos secrets do Actions.
- Categorias: CPU, placa-mãe, RAM, GPU, armazenamento, fonte, gabinete e cooler. RAM e armazenamento aceitam várias Peças; as demais, uma.
- Incompatibilidades físicas são Bloqueantes; as de margem geram Alerta.
- Premissa assumida: testes de unidade com Vitest, testes de ponta a ponta com Playwright, e deploy em hospedagem estática (Vercel, Netlify ou GitHub Pages). A escolha do provedor fica para a Fase 8.
- Premissa assumida: projeto de uma pessoa, sem prazo fixo.

## Fora do escopo

- Contas de usuário, login e Builds salvas na nuvem.
- Preço consultado na hora da busca, proxy serverless ou qualquer servidor em runtime.
- Scraping de lojas. Lomadee, Awin e SerpApi (chave secreta, sem CORS).
- Uso comercial (vetado pela licença do OpenDB).
- Histórico de preços.
- Multi-GPU, ventoinhas avulsas e regras completas (comprimento de GPU, altura de cooler, versão de BIOS).
- FPS estimado por jogo.
- Fotos reais de produtos na Bancada.
- Outras moedas e idiomas.

## Visão das fases

| Fase | Objetivo                                                | Status       |
| ---- | ------------------------------------------------------- | ------------ |
| 1    | Fundação do projeto e Catálogo inicial validado         | Concluída    |
| 2    | Motor de regras: compatibilidade, Orçamento e Checklist | Concluída |
| 3    | Busca e montagem por clique com painel de Orçamento     | Concluída    |
| 4    | Bancada 2D com arrastar e soltar e Bandeja              | Concluída    |
| 5    | Persistência, Meta de orçamento e link compartilhável   | Concluída    |
| 6    | Pontuação de desempenho por Perfil                      | Concluída    |
| 7    | Desafios                                                | Concluída    |
| 8    | Mobile, acessibilidade, Catálogo completo e publicação  | Em andamento |
| 9    | Catálogo fora do bundle, carregado por fetch            | Concluída    |
| 10   | Busca assíncrona com debounce e cancelamento            | Concluída    |
| 11   | Pipeline de specs a partir do OpenDB                    | Concluída    |
| 12   | Coleta de preços no Mercado Livre                       | Não iniciada |
| 13   | Publicação diária automática com validação              | Não iniciada |
| 14   | Peças fora de venda no app                              | Não iniciada |
| 15   | Offline e documentação do novo Catálogo                 | Não iniciada |

---

## Fase 1: Fundação e Catálogo inicial

**Objetivo:** ter o projeto rodando com um Catálogo pequeno, tipado e validado, que sirva de base a todas as outras fases.

**Depende de:** —

**Entregáveis:**

- [x] Projeto Vite + React + TypeScript com ESLint, Prettier e Vitest; `npm run dev`, `lint`, `test` e `build` funcionando.
- [x] CI que roda lint, testes e build a cada push.
- [x] Schema Zod da Peça para cada Categoria, com specs de compatibilidade (socket, tipo de RAM, form factor, consumo, potência, vídeo integrado, cooler box, Slots oferecidos pela placa-mãe) e Faixa de preço.
- [x] Catálogo inicial com cerca de 40 Peças (4 a 6 por Categoria) em JSON, mais a Data de referência.
- [x] Teste que valida todo o Catálogo contra o schema e falha se houver IDs repetidos ou Faixa de preço inválida (mín > médio > máx).

**Critério de conclusão:** `npm test` valida o Catálogo inicial e a CI passa.

**Riscos / pontos de atenção:** o schema define o que as regras e a Bancada conseguem fazer. Revisar contra as regras da Fase 2 antes de fechar.

---

## Fase 2: Motor de regras

**Objetivo:** ter a lógica do domínio pronta e testada, sem depender de interface.

**Depende de:** Fase 1

**Entregáveis:**

- [x] Modelo de Build em TypeScript puro: encaixar e remover Peças, respeitando as quantidades por Categoria e os Slots oferecidos pela placa-mãe.
- [x] Regras Bloqueantes: socket CPU↔placa-mãe, tipo de RAM↔placa-mãe, form factor placa-mãe↔gabinete, número de pentes ≤ slots DIMM, discos M.2 ≤ slots M.2.
- [x] Regra de Alerta: potência da fonte comparada ao consumo estimado da Build, com margem configurável.
- [x] Cálculo do Orçamento (total médio e faixa mín–máx) somente com as Peças encaixadas.
- [x] Checklist condicional: GPU exigida só se a CPU não tiver vídeo integrado; cooler exigido só se a CPU não vier com cooler box.
- [x] Função que lista as Peças que ficam incompatíveis quando a placa-mãe é trocada, para a Bandeja da Fase 4.
- [x] Testes de unidade para cada regra, incluindo o cenário da troca de AM5/DDR5 para LGA1700/DDR4.

**Critério de conclusão:** todas as regras do glossário têm testes passando e a cobertura do motor de regras é de pelo menos 90%.

---

## Fase 3: Busca e montagem por clique

**Objetivo:** primeira versão usável de ponta a ponta. O usuário pesquisa Peças, monta uma Build por clique e vê o Orçamento.

**Depende de:** Fase 2

**Entregáveis:**

- [x] Painel de busca com texto, filtros (Categoria, marca, faixa de preço), ordenação por preço e a opção "só compatíveis".
- [x] Card de Peça com specs principais e Faixa de preço, mostrando quando ela é incompatível com a Build atual.
- [x] Botão "adicionar à Build" com mensagem de bloqueio quando há Incompatibilidade Bloqueante.
- [x] Painel de Orçamento com total médio, faixa mín–máx e Data de referência.
- [x] Painel de Checklist e lista de Alertas.
- [x] Teste de ponta a ponta (Playwright) montando uma Build completa e conferindo o Orçamento.

**Critério de conclusão:** dá para montar uma Build completa e compatível pela interface, com o Orçamento correto e o teste de ponta a ponta passando.

---

## Fase 4: Bancada 2D

**Objetivo:** entregar a experiência "tipo jogo", em que o usuário arrasta Peças para os Slots de uma Bancada ilustrada.

**Depende de:** Fase 3

**Entregáveis:**

- [x] Bancada em SVG com o gabinete aberto. Os Slots da placa-mãe (socket, DIMM, PCIe, M.2) só aparecem depois que há uma placa-mãe; gabinete e fonte podem entrar a qualquer momento.
- [x] Ilustração SVG genérica para cada Categoria, com variações de tamanho e cor.
- [x] Arrastar e soltar (dnd-kit) da busca para os Slots. Os Slots compatíveis acendem e os Bloqueantes ficam vermelhos durante o arraste.
- [x] Animação de encaixe e de remoção (Framer Motion).
- [x] Bandeja: recebe Peças arrastadas da busca e as Peças que saem dos Slots numa troca de placa-mãe, e mostra o próprio subtotal fora do Orçamento.
- [x] Arrastar com o teclado funcionando (sensor de teclado do dnd-kit).
- [x] Testes de ponta a ponta do arraste e da troca de placa-mãe com Peças indo para a Bandeja.

**Critério de conclusão:** dá para montar uma Build completa só arrastando no desktop, e a troca de placa-mãe manda as Peças incompatíveis para a Bandeja.

**Riscos / pontos de atenção:** produzir as ilustrações SVG pode levar mais tempo que o código. Começar com formas simples e refinar na Fase 8.

---

## Fase 5: Persistência, Meta e compartilhamento

**Objetivo:** o usuário não perde a Build, pode definir um teto de gasto e pode compartilhar a Build.

**Depende de:** Fase 4

**Entregáveis:**

- [x] Build e Bandeja salvas automaticamente no localStorage e restauradas ao recarregar a página.
- [x] Campo de Meta de orçamento com barra que mostra quanto falta ou quanto passou do teto.
- [x] Link compartilhável com os IDs das Peças, as quantidades e a Meta. Ao abrir o link, os preços são recalculados pelo Catálogo atual.
- [x] Aviso ao abrir um link com Peças que não existem mais no Catálogo.
- [x] Testes para codificar e decodificar o link, incluindo IDs inválidos.

**Critério de conclusão:** um link copiado e aberto em outra aba reproduz a mesma Build e a mesma Meta.

---

## Fase 6: Pontuação por Perfil

**Objetivo:** mostrar o desempenho estimado da Build nos Perfis Jogos e Produtividade.

**Depende de:** Fase 2 (lógica) e Fase 4 (exibição)

**Entregáveis:**

- [x] Índices de desempenho por Perfil adicionados ao schema e às CPUs e GPUs do Catálogo, com as fontes de benchmark documentadas em `docs/pontuacao.md`.
- [x] Cálculo da Pontuação por Perfil com penalidade por Gargalo (CPU desproporcional à GPU, pouca RAM).
- [x] Painel de Pontuação com explicação dos Gargalos encontrados.
- [x] Ordenação da busca pelo Índice de desempenho.
- [x] Testes do cálculo com Builds de referência (equilibrada, com gargalo de CPU, com pouca RAM).

**Critério de conclusão:** as Builds de referência geram Pontuações coerentes e testadas, e o painel explica cada penalidade.

**Riscos / pontos de atenção:** calibrar os Índices é subjetivo. Documentar a fórmula para poder ajustar depois.

---

## Fase 7: Desafios

**Objetivo:** dar metas ao usuário com missões que têm restrições e mostram o progresso.

**Depende de:** Fases 5 e 6

**Entregáveis:**

- [x] Formato declarativo de Desafio (Orçamento máximo, Pontuação mínima por Perfil, Categorias exigidas) validado por Zod.
- [x] Cerca de 10 Desafios escritos à mão, cada um com pelo menos uma solução possível com o Catálogo (verificada em teste).
- [x] Tela de Desafios. Iniciar um Desafio abre uma Build própria com a Meta travada, sem mexer na Build livre.
- [x] Indicador de critérios cumpridos durante a montagem e tela de conclusão com a animação do PC ligando.
- [x] Desafios concluídos salvos no localStorage.

**Critério de conclusão:** dá para concluir um Desafio de ponta a ponta, ele aparece como concluído depois de recarregar a página e a Build livre fica intacta.

---

## Fase 8: Mobile, acessibilidade, Catálogo completo e publicação

**Objetivo:** deixar o app pronto para usuários reais, em qualquer tela, com o Catálogo completo e publicado.

**Depende de:** Fases 1 a 7

**Entregáveis:**

- [x] Layout para celular: busca num painel inferior, arraste por toque e alternativa de tocar no Slot para abrir uma lista filtrada.
- [x] Revisão de acessibilidade: contraste, foco visível, rótulos para leitores de tela e anúncios ao encaixar ou bloquear uma Peça.
- [x] Catálogo ampliado para cerca de 150 Peças populares no Brasil, com a Data de referência atualizada.
- [x] Guia curto (`docs/atualizar-catalogo.md`) explicando como atualizar preços e adicionar Peças.
- [x] Polimento visual das ilustrações e animações.
- [ ] Deploy em hospedagem estática, com publicação automática a partir da branch principal.

**Critério de conclusão:** o app está publicado, passa nos testes de ponta a ponta em viewport de celular e de desktop, e o Lighthouse dá nota de acessibilidade de pelo menos 90.

**Riscos / pontos de atenção:** curar 150 Peças com specs e preços dá trabalho manual. Pode ser feito em paralelo às fases anteriores.

---

## Fase 9: Catálogo fora do bundle

**Objetivo:** o app passa a buscar o Catálogo por fetch em vez de importá-lo no bundle, sem mudar nada do que o usuário vê depois de carregar.

**Depende de:** Fase 8

**Entregáveis:**

- [x] Os JSON atuais do Catálogo saem de `src/catalogo/dados/` e passam a ser servidos em `/dados/` (provisoriamente versionados em `public/dados/` até a Fase 13).
- [x] `carregarCatalogo` assíncrono: faz fetch, valida pelo schema Zod e devolve o Catálogo ou um erro tipado.
- [x] Tela de carregamento enquanto o Catálogo não chega, e tela de erro com "Tentar de novo" se o fetch ou a validação falhar.
- [x] O bundle de produção não contém mais nenhuma Peça (verificável por busca no `dist/`).
- [x] Testes de unidade e de componente usam fixtures próprias (`src/teste/`) em vez do Catálogo real. Os e2e interceptam `/dados/` com uma fixture fixa.

**Critério de conclusão:** o app abre, mostra a tela de carregamento e funciona como antes. Com `/dados/` fora do ar, aparece a tela de erro. Testes, e2e e Lighthouse passam.

**Riscos / pontos de atenção:** os testes que hoje dependem de valores reais em R$ e de termos de busca (ver `docs/atualizar-catalogo.md`, passo 7) precisam migrar para fixtures. É o maior volume de trabalho da fase.

---

## Fase 10: Busca assíncrona

**Objetivo:** a pesquisa de Peças passa por uma porta assíncrona com debounce e cancelamento, pronta para trocar de implementação sem mudar a interface.

**Depende de:** Fase 9

**Entregáveis:**

- [x] Porta `buscarPecas(filtros, signal): Promise<Peca[]>` com implementação sobre o Catálogo em memória (reaproveitando `filtrarPecas`).
- [x] Hook de busca com debounce de ~250 ms no texto, `AbortController` que cancela a busca anterior e descarte de respostas fora de ordem.
- [x] Indicador de "buscando" e estado vazio que distingue "nenhum resultado" de "ainda buscando".
- [x] Testes com timers falsos: digitação rápida dispara uma busca só, e uma busca cancelada não sobrescreve a mais recente.

**Critério de conclusão:** digitar "rtx 4060" dispara uma única busca após a pausa, os testes de corrida passam e o e2e de montar uma Build continua verde.

---

## Fase 11: Pipeline de specs a partir do OpenDB

**Objetivo:** gerar o Catálogo a partir do OpenDB em vez de JSON escrito à mão, mantendo os mesmos IDs e Índices.

**Depende de:** Fase 9

**Entregáveis:**

- [x] Script Node (`pipeline/`) que baixa o OpenDB numa tag ou commit fixado e normaliza cada Categoria para o schema do app (socket, tipoRam, formFactor, consumo etc.), descartando Peças com specs incompletas.
- [x] Arquivo curado de Índices de desempenho de CPU e GPU. CPU ou GPU sem Índice fica de fora.
- [x] Slug determinístico `categoria-marca-modelo` e tabela fixa de aliases dos 152 IDs antigos, com teste garantindo que todos resolvem.
- [x] Enquanto não há coleta de preços, as Faixas de preço vêm do Catálogo antigo, e só entram Peças que têm preço.
- [x] Atribuição ao BuildCores OpenDB (CC BY-NC-SA 4.0) no app e no README.
- [x] Testes do normalizador com amostras do OpenDB, incluindo Peças com specs faltando.

**Critério de conclusão:** `npm run pipeline` gera `/dados/` válido pelo schema, os 152 IDs antigos resolvem, os Desafios continuam com solução e o app funciona com os dados gerados.

**Riscos / pontos de atenção:** os enums do OpenDB podem não bater com os do app (nomes de socket, form factors exóticos). O normalizador precisa registrar o que descartou, para que não se perca Peça em silêncio.

---

## Fase 12: Coleta de preços no Mercado Livre

**Objetivo:** cada Peça ganha uma Faixa de preço calculada a partir de Anúncios reais do dia, e o Catálogo cresce para além das 152 Peças.

**Depende de:** Fase 11

**Entregáveis:**

- [ ] App OAuth no Mercado Livre e cliente que obtém o token no pipeline a partir de variáveis de ambiente (sem segredo no repositório).
- [ ] Busca de Anúncios pelo modelo da Peça, descartando usados, kits e outliers, e exigindo um número mínimo de Anúncios válidos.
- [ ] Faixa de preço: mín = menor Anúncio válido, médio = mediana, máx = percentil 90. A Data de referência passa a ser o dia da coleta (`AAAA-MM-DD`).
- [ ] Peças sem Anúncios válidos ficam fora do Catálogo.
- [ ] Relatório da coleta (Peças com preço, sem Anúncio e descartadas por filtro).
- [ ] Testes do filtro e da estatística com respostas gravadas da API.

**Critério de conclusão:** uma execução local gera um Catálogo de 500 a 3.000 Peças com Faixas de preço do dia, e uma amostragem manual de 20 Peças confere com o Mercado Livre.

**Riscos / pontos de atenção:** casar Anúncio com Peça pelo modelo gera falsos positivos (variações, kits, modelos parecidos). Os limites de requisição da API precisam caber na execução diária.

---

## Fase 13: Publicação diária automática

**Objetivo:** o Catálogo se atualiza sozinho todo dia, sem dados no Git e sem publicar nada que quebre Desafios.

**Depende de:** Fase 12 e o deploy da Fase 8

**Entregáveis:**

- [ ] Workflow agendado (cron diário) que roda o pipeline com o token nos secrets e publica `/dados/` no artefato do Pages junto com o app.
- [ ] Antes de publicar, o pipeline valida o schema e as soluções dos Desafios usando só Peças à venda. Se algo falhar, não publica (os dados anteriores continuam no ar) e o workflow falha com aviso.
- [ ] O pipeline lê os dados publicados anteriormente para manter as Peças que saíram de venda, marcadas como fora de venda e com a última Faixa de preço.
- [ ] `public/dados/` sai do repositório. O deploy por push também passa a rodar o pipeline (ou a reaproveitar os últimos dados publicados).

**Critério de conclusão:** duas execuções agendadas seguidas publicam sem intervenção, a Data de referência no app muda de um dia para o outro e uma falha simulada de Desafio impede a publicação.

**Riscos / pontos de atenção:** o GitHub desativa workflows agendados em repositórios sem atividade por 60 dias. Uma mudança de preços pode deixar um Desafio sem solução e travar a publicação até um ajuste manual.

---

## Fase 14: Peças fora de venda no app

**Objetivo:** Builds e links antigos continuam remontando quando uma Peça sai de venda, sem que ela pareça disponível.

**Depende de:** Fase 13

**Entregáveis:**

- [ ] Schema da Peça com a marca de fora de venda e a data do último preço.
- [ ] A busca não mostra Peças fora de venda, mas a remontagem por localStorage e por link as encontra.
- [ ] O Orçamento soma a última Faixa de preço e mostra o alerta "preço de <data>, fora de venda".
- [ ] Desafios não aceitam Build com Peça fora de venda, e o painel do Desafio explica o motivo.
- [ ] Testes de unidade e e2e: abrir um link com Peça fora de venda reproduz a Build com o alerta.

**Critério de conclusão:** um link com uma Peça marcada como fora de venda abre a mesma Build, o Orçamento mostra o alerta e o Desafio não é concluído.

---

## Fase 15: Offline e documentação do novo Catálogo

**Objetivo:** o app abre mesmo sem rede com os últimos dados baixados, e a documentação reflete o Catálogo gerado.

**Depende de:** Fase 13

**Entregáveis:**

- [ ] Service Worker que guarda em cache o app e a última versão de `/dados/`, mostrando a Data de referência dos dados em cache. Sem cache, aparece a tela de erro da Fase 9.
- [ ] Teste e2e offline: depois de uma visita, o app abre com a rede desligada.
- [ ] `docs/atualizar-catalogo.md` reescrito: como funciona o pipeline, como curar Índices e aliases, como reagir a uma publicação bloqueada.
- [ ] `docs/pontuacao.md` atualizado para os Índices curados fora do Catálogo.

**Critério de conclusão:** o app abre offline após uma visita, o Lighthouse continua com acessibilidade ≥ 90 e os guias descrevem o processo atual.

## Riscos gerais e questões em aberto

- Até a Fase 13, os preços envelhecem porque não há atualização automática (ADR 0001). Depois dela, o risco passa a ser a coleta falhar ou casar Anúncios errados.
- A tabela de aliases e os Índices curados viram o ponto de manutenção manual: CPUs e GPUs novas só aparecem quando ganham Índice.
- Dependências externas: a licença CC BY-NC-SA do OpenDB impede uso comercial, e mudanças nos termos ou no acesso da API do Mercado Livre afetam a coleta.
- Provedor de deploy escolhido na Fase 8: GitHub Pages via GitHub Actions. Falta criar o repositório remoto e ativar o Pages.
- A calibração dos Índices de desempenho e das penalidades por Gargalo pode precisar de vários ajustes.
