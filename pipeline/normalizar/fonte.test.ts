import { describe, expect, it } from 'vitest'
import cx650 from '../teste/amostras/fonte-corsair-cx650.json'
import silver from '../teste/amostras/fonte-fsp-raider-s-silver.json'
import semPotencia from '../teste/amostras/fonte-sem-potencia.json'
import standard from '../teste/amostras/fonte-thermaltake-smart-standard.json'
import { normalizarFonte } from './fonte'

describe('normalizarFonte', () => {
  it('converte potência e certificação', () => {
    expect(normalizarFonte(cx650)).toEqual({
      ok: true,
      peca: {
        opendbId: '37cafcad-23ec-4dc2-945a-15ebfaf516b0',
        categoria: 'fonte',
        marca: 'Corsair',
        nome: 'CX650 (2017) ATX 650W Non-Modular 80+ Bronze Certified',
        potenciaW: 650,
        certificacao: 'Bronze',
      },
    })
  })

  it.each([
    [silver, 'Silver'],
    [standard, '80 Plus'],
    [{ ...cx650, efficiency_rating: '80+ White' }, '80 Plus'],
    [{ ...cx650, efficiency_rating: '80+' }, '80 Plus'],
    [{ ...cx650, efficiency_rating: '80+ Titanium' }, 'Titanium'],
  ])('mapeia a certificação %#', (registro, certificacao) => {
    expect(normalizarFonte(registro)).toMatchObject({ ok: true, peca: { certificacao } })
  })

  it('descarta fonte sem potência ou sem certificação', () => {
    expect(normalizarFonte(semPotencia)).toEqual({ ok: false, motivo: 'spec faltando: potência' })
    expect(normalizarFonte({ ...cx650, efficiency_rating: null })).toEqual({
      ok: false,
      motivo: 'spec faltando: certificação',
    })
  })
})
