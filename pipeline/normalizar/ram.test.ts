import { describe, expect, it } from 'vitest'
import ddr3 from '../teste/amostras/ram-adata-ddr3.json'
import ddr4 from '../teste/amostras/ram-corsair-vengeance-16gb-ddr4-3200.json'
import sodimm from '../teste/amostras/ram-crucial-sodimm-ddr5.json'
import ddr5 from '../teste/amostras/ram-kingston-fury-16gb-ddr5-5200.json'
import { normalizarRam } from './ram'

describe('normalizarRam', () => {
  it('aceita DIMM DDR4 e DDR5', () => {
    expect(normalizarRam(ddr4)).toEqual({
      ok: true,
      peca: {
        opendbId: '1beff168-4d5b-4e95-a5ba-385a9e225c26',
        categoria: 'ram',
        marca: 'Corsair',
        nome: 'Vengeance RGB Black DDR4-3200 CL16 16GB (2x8GB)',
        tipoRam: 'DDR4',
        capacidadeTotalGB: 16,
        modulos: 2,
        frequenciaMHz: 3200,
      },
    })
    expect(normalizarRam(ddr5)).toMatchObject({
      ok: true,
      peca: { tipoRam: 'DDR5', capacidadeTotalGB: 16, modulos: 1, frequenciaMHz: 5200 },
    })
  })

  it('calcula a capacidade pelos módulos quando `capacity` falta', () => {
    expect(normalizarRam({ ...ddr4, capacity: null })).toMatchObject({
      ok: true,
      peca: { capacidadeTotalGB: 16 },
    })
  })

  it('descarta SO-DIMM e DDR3', () => {
    expect(normalizarRam(sodimm)).toEqual({
      ok: false,
      motivo: 'form factor não suportado: 262-pin SO-DIMM',
    })
    expect(normalizarRam(ddr3)).toEqual({ ok: false, motivo: 'tipo de RAM não suportado: DDR3' })
  })
})
