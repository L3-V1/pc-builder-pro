import { describe, expect, it } from 'vitest'
import semTdp from '../teste/amostras/gpu-evga-gtx-1660-sem-tdp.json'
import strix from '../teste/amostras/gpu-asus-rog-strix-rtx-4060.json'
import { normalizarGpu } from './gpu'

describe('normalizarGpu', () => {
  it('extrai consumo e VRAM, usa a marca da placa e devolve a chave de chipset', () => {
    expect(normalizarGpu(strix)).toEqual({
      ok: true,
      peca: {
        opendbId: '3b14b440-5219-4631-a16e-0b22c2f3d18d',
        chave: 'GeForce RTX 4060',
        categoria: 'gpu',
        marca: 'ASUS',
        nome: 'ROG Strix GeForce RTX 4060 8GB GDDR6 Black',
        consumoW: 115,
        vramGB: 8,
      },
    })
  })

  it('descarta GPU sem TDP com motivo "spec faltando"', () => {
    expect(normalizarGpu(semTdp)).toEqual({ ok: false, motivo: 'spec faltando: TDP' })
  })
})
