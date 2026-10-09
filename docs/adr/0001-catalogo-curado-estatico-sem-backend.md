---
status: superseded by ADR-0003
---

# Catálogo curado estático, sem backend

O Catálogo (~150 Peças, specs, Faixas de preço em R$ e Índices de desempenho) vive em arquivos JSON versionados no repositório, validados por schema, com uma Data de referência global. Não há backend: Builds ficam no localStorage e o compartilhamento é feito por URL com IDs de Peças, recalculando preços a partir do Catálogo atual. Rejeitamos scraping de lojas e APIs de terceiros porque são frágeis, exigem backend/cron e podem violar termos de uso. Em troca, os preços envelhecem e precisam ser atualizados manualmente.
