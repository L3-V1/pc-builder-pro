import type { Categoria } from '../src/catalogo'

// O OpenDB não tem tags: o commit fixado torna o pipeline reproduzível.
export const OPENDB_SHA = '50059f5ec7ba1c28c20ed6ca53b2954d8d03f042'
export const OPENDB_TARBALL = `https://codeload.github.com/buildcores/buildcores-open-db/tar.gz/${OPENDB_SHA}`

// Pasta de cada Categoria do app dentro de `open-db/`.
export const PASTAS_OPENDB: Record<Categoria, string> = {
  cpu: 'CPU',
  'placa-mae': 'Motherboard',
  ram: 'RAM',
  gpu: 'GPU',
  armazenamento: 'Storage',
  fonte: 'PSU',
  gabinete: 'PCCase',
  cooler: 'CPUCooler',
}

const raiz = new URL('../', import.meta.url)

export const CAMINHOS = {
  cache: new URL('pipeline/.cache/', raiz),
  opendb: new URL(`pipeline/.cache/opendb-${OPENDB_SHA}/`, raiz),
  relatorio: new URL('pipeline/.cache/relatorio.json', raiz),
  legado: new URL('pipeline/legado/', raiz),
  curadoria: new URL('pipeline/curadoria/', raiz),
  saida: new URL('public/dados/', raiz),
  // Segredos do Mercado Livre (coberto pelo *.local do .gitignore).
  envLocal: new URL('.env.local', raiz),
  // Respostas da API, uma pasta por dia de coleta.
  cacheMl: (dia: string) => new URL(`pipeline/.cache/ml/${dia}/`, raiz),
}

// Coleta de preços no Mercado Livre.
export const ML_API = 'https://api.mercadolibre.com'
// Requisições simultâneas à API; 429 e 5xx são repetidos com backoff pelo cliente.
export const CONCORRENCIA_ML = 4
