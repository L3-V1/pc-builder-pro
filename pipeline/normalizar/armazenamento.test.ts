import { describe, expect, it } from 'vitest'
import a400 from '../teste/amostras/armazenamento-kingston-a400-120gb.json'
import a400M2 from '../teste/amostras/armazenamento-kingston-a400-m2-240gb.json'
import nv2 from '../teste/amostras/armazenamento-kingston-nv2-1tb.json'
import hdd from '../teste/amostras/armazenamento-seagate-hdd-2tb.json'
import { normalizarArmazenamento } from './armazenamento'

describe('normalizarArmazenamento', () => {
  it('mapeia M.2 NVMe, M.2 SATA e 2.5" SATA', () => {
    expect(normalizarArmazenamento(nv2)).toEqual({
      ok: true,
      peca: {
        opendbId: 'b24efdeb-92d7-4ed1-a616-f692662eb226',
        categoria: 'armazenamento',
        marca: 'Kingston',
        nome: 'NV2 1TB SSD M.2-2280 PCIe 4.0 x4 NVMe',
        formato: 'M.2',
        interface: 'NVMe',
        capacidadeGB: 1000,
      },
    })
    expect(normalizarArmazenamento(a400M2)).toMatchObject({
      ok: true,
      peca: { formato: 'M.2', interface: 'SATA', capacidadeGB: 240 },
    })
    expect(normalizarArmazenamento(a400)).toMatchObject({
      ok: true,
      peca: { formato: '2.5', interface: 'SATA', capacidadeGB: 120 },
    })
  })

  it('descarta HDD 3.5" e HDD 2.5"', () => {
    expect(normalizarArmazenamento(hdd)).toEqual({
      ok: false,
      motivo: 'formato não suportado: 3.5"',
    })
    expect(normalizarArmazenamento({ ...a400, storage_type: 'HDD' })).toEqual({
      ok: false,
      motivo: 'tipo não suportado: HDD',
    })
  })
})
