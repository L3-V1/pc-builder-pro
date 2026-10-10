import { describe, expect, it } from 'vitest'
import fx from '../teste/amostras/cpu-fx-8350-am3.json'
import i5 from '../teste/amostras/cpu-core-i5-12400.json'
import ryzen from '../teste/amostras/cpu-ryzen-5-5600.json'
import { normalizarCpu } from './cpu'

describe('normalizarCpu', () => {
  it('converte uma amostra completa', () => {
    expect(normalizarCpu(ryzen)).toEqual({
      ok: true,
      peca: {
        opendbId: '04984638-674b-4384-8866-a7b20d55f8b4',
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
      },
    })
    expect(normalizarCpu(i5)).toMatchObject({
      ok: true,
      peca: {
        nome: 'Core i5 12400',
        chave: 'core-i5-12400',
        socket: 'LGA1700',
        videoIntegrado: true,
      },
    })
  })

  it.each([
    ['socket', { ...ryzen, socket: undefined }],
    ['TDP', { ...ryzen, specifications: { ...ryzen.specifications, tdp: 0 } }],
    ['núcleos', { ...ryzen, cores: { ...ryzen.cores, total: null } }],
  ])('descarta CPU sem %s com motivo "spec faltando"', (spec, registro) => {
    expect(normalizarCpu(registro)).toEqual({ ok: false, motivo: `spec faltando: ${spec}` })
  })

  it('descarta CPU de socket fora do app com motivo "socket não suportado"', () => {
    expect(normalizarCpu(fx)).toEqual({ ok: false, motivo: 'socket não suportado: AM3+' })
  })
})
