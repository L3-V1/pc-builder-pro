import { describe, expect, it } from 'vitest'
import nr200p from '../teste/amostras/gabinete-cooler-master-nr200p.json'
import h5 from '../teste/amostras/gabinete-nzxt-h5-flow.json'
import { normalizarGabinete } from './gabinete'

describe('normalizarGabinete', () => {
  it('converte os form factors suportados', () => {
    expect(normalizarGabinete(h5)).toEqual({
      ok: true,
      peca: {
        opendbId: '5619fdec-6575-4d2c-887e-70da440a40ac',
        categoria: 'gabinete',
        marca: 'NZXT',
        nome: 'H5 Flow (2022) ATX Mid Tower White with Tempered Glass Side Panel',
        formFactorsSuportados: ['ATX', 'Micro-ATX', 'Mini-ITX'],
      },
    })
  })

  it('filtra form factors fora do app', () => {
    expect(normalizarGabinete(nr200p)).toMatchObject({
      ok: true,
      peca: { formFactorsSuportados: ['Mini-ITX'] },
    })
  })

  it('descarta gabinete sem form factor do app ou sem a lista', () => {
    expect(
      normalizarGabinete({ ...h5, supported_motherboard_form_factors: ['EATX', 'SSI EEB'] }),
    ).toEqual({ ok: false, motivo: 'form factor não suportado: EATX, SSI EEB' })
    expect(normalizarGabinete({ ...h5, supported_motherboard_form_factors: null })).toEqual({
      ok: false,
      motivo: 'spec faltando: form factors',
    })
  })
})
