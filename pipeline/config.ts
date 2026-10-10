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
}
