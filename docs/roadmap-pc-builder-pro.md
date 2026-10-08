# Roadmap: PC Builder Pro

> Criado em 2026-10-06 · Última atualização 2026-10-07

## Visão geral

O PC Builder Pro é uma aplicação web em que o usuário monta um PC como num jogo 2D. Ele pesquisa Peças reais do mercado brasileiro e as arrasta para os Slots de uma Bancada interativa. Enquanto monta, o app valida a compatibilidade entre as Peças, calcula o Orçamento estimado em R$ e a Pontuação de desempenho, e propõe Desafios. O público são entusiastas e iniciantes que querem planejar um PC sem planilhas nem dúvidas de compatibilidade.

## Objetivo final

Uma aplicação estática publicada, em pt-BR, que funciona no desktop e no celular, com Catálogo curado de cerca de 150 Peças, Bancada 2D com arrastar e soltar, Orçamento com faixa de preço, Pontuação por Perfil, Desafios e Builds compartilháveis por link.

## Premissas e restrições

- Vocabulário do domínio definido em `GLOSSARY.md`. Decisões de arquitetura em `docs/adr/` (0001: Catálogo estático sem backend; 0002: Bancada em SVG/DOM).
- Stack: React, TypeScript e Vite. Arrastar e soltar com dnd-kit, animações com Framer Motion, schema do Catálogo com Zod.
- Não há backend. A Build fica salva no localStorage e é compartilhada por URL com os IDs das Peças e a Meta.
- Catálogo em JSON versionado no repositório. Cada Peça tem uma Faixa de preço (mín, médio e máx) em R$ e o Catálogo tem uma Data de referência global. Os preços são atualizados à mão.
- Categorias: CPU, placa-mãe, RAM, GPU, armazenamento, fonte, gabinete e cooler. RAM e armazenamento aceitam várias Peças; as demais, uma.
- Incompatibilidades físicas são Bloqueantes; as de margem geram Alerta.
- Premissa assumida: testes de unidade com Vitest, testes de ponta a ponta com Playwright, e deploy em hospedagem estática (Vercel, Netlify ou GitHub Pages). A escolha do provedor fica para a Fase 8.
- Premissa assumida: projeto de uma pessoa, sem prazo fixo.

## Fora do escopo

- Contas de usuário, login e Builds salvas na nuvem.
- Preços ao vivo, scraping de lojas ou APIs de terceiros.
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
| 7    | Desafios                                                | Não iniciada |
| 8    | Mobile, acessibilidade, Catálogo completo e publicação  | Não iniciada |

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

- [ ] Formato declarativo de Desafio (Orçamento máximo, Pontuação mínima por Perfil, Categorias exigidas) validado por Zod.
- [ ] Cerca de 10 Desafios escritos à mão, cada um com pelo menos uma solução possível com o Catálogo (verificada em teste).
- [ ] Tela de Desafios. Iniciar um Desafio abre uma Build própria com a Meta travada, sem mexer na Build livre.
- [ ] Indicador de critérios cumpridos durante a montagem e tela de conclusão com a animação do PC ligando.
- [ ] Desafios concluídos salvos no localStorage.

**Critério de conclusão:** dá para concluir um Desafio de ponta a ponta, ele aparece como concluído depois de recarregar a página e a Build livre fica intacta.

---

## Fase 8: Mobile, acessibilidade, Catálogo completo e publicação

**Objetivo:** deixar o app pronto para usuários reais, em qualquer tela, com o Catálogo completo e publicado.

**Depende de:** Fases 1 a 7

**Entregáveis:**

- [ ] Layout para celular: busca num painel inferior, arraste por toque e alternativa de tocar no Slot para abrir uma lista filtrada.
- [ ] Revisão de acessibilidade: contraste, foco visível, rótulos para leitores de tela e anúncios ao encaixar ou bloquear uma Peça.
- [ ] Catálogo ampliado para cerca de 150 Peças populares no Brasil, com a Data de referência atualizada.
- [ ] Guia curto (`docs/atualizar-catalogo.md`) explicando como atualizar preços e adicionar Peças.
- [ ] Polimento visual das ilustrações e animações.
- [ ] Deploy em hospedagem estática, com publicação automática a partir da branch principal.

**Critério de conclusão:** o app está publicado, passa nos testes de ponta a ponta em viewport de celular e de desktop, e o Lighthouse dá nota de acessibilidade de pelo menos 90.

**Riscos / pontos de atenção:** curar 150 Peças com specs e preços dá trabalho manual. Pode ser feito em paralelo às fases anteriores.

## Riscos gerais e questões em aberto

- Os preços envelhecem, porque não há atualização automática (ver ADR 0001). A Data de referência deixa isso visível ao usuário.
- O provedor de deploy ainda não foi escolhido.
- A calibração dos Índices de desempenho e das penalidades por Gargalo pode precisar de vários ajustes.
