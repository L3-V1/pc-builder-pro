import type { Normalizada } from '../normalizar'

// Peças já normalizadas para os testes de preço, sem passar pelos registros do OpenDB.
export const ryzen5600: Normalizada = {
  opendbId: 'cpu-ryzen-5-5600',
  chave: 'ryzen-5-5600',
  categoria: 'cpu',
  marca: 'AMD',
  nome: 'Ryzen 5 5600',
  socket: 'AM4',
  nucleos: 6,
  threads: 12,
  consumoW: 65,
  videoIntegrado: false,
  coolerBox: true,
}

export const rx6600: Normalizada = {
  opendbId: 'gpu-asrock-rx-6600',
  chave: 'Radeon RX 6600',
  categoria: 'gpu',
  marca: 'ASRock',
  nome: 'Challenger D Radeon RX 6600 8GB',
  consumoW: 132,
  vramGB: 8,
}

export const furyDdr5: Normalizada = {
  opendbId: 'ram-kingston-fury-ddr5',
  categoria: 'ram',
  marca: 'Kingston',
  nome: 'FURY Beast Black DDR5-5200 CL40 16GB (2x8GB)',
  tipoRam: 'DDR5',
  capacidadeTotalGB: 16,
  modulos: 2,
  frequenciaMHz: 5200,
}
