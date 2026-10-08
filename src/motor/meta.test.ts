import { describe, expect, it } from 'vitest'
import { interpretarMeta, situacaoMeta } from './meta'

const faixa = (min: number, medio: number, max: number) => ({ min, medio, max })

describe('situacaoMeta', () => {
  it('médio abaixo da Meta fica dentro, com falta e percentual', () => {
    expect(situacaoMeta(faixa(2800, 3000, 3500), 4000)).toEqual({
      tipo: 'dentro',
      falta: 1000,
      percentual: 75,
    })
  })

  it('médio acima da Meta fica acima, com excesso', () => {
    expect(situacaoMeta(faixa(4500, 5000, 5600), 4000)).toEqual({
      tipo: 'acima',
      excesso: 1000,
      percentual: 125,
    })
  })

  it('médio igual à Meta fica dentro, com falta zero', () => {
    expect(situacaoMeta(faixa(3500, 4000, 4000), 4000)).toEqual({
      tipo: 'dentro',
      falta: 0,
      percentual: 100,
    })
  })

  it('médio dentro e máximo acima preenchem excessoNoMaximo', () => {
    expect(situacaoMeta(faixa(3500, 3800, 4300), 4000)).toEqual({
      tipo: 'dentro',
      falta: 200,
      percentual: 95,
      excessoNoMaximo: 300,
    })
  })
})

describe('interpretarMeta', () => {
  it.each([
    ['5.000', 5000],
    ['5000', 5000],
    [' 1.000.000 ', 1_000_000],
    ['1', 1],
  ])('"%s" vale %i', (texto, valor) => {
    expect(interpretarMeta(texto)).toEqual({ ok: true, valor })
  })

  it('vazio remove a Meta', () => {
    expect(interpretarMeta('  ')).toEqual({ ok: true })
  })

  it.each(['abc', '0', '-5', '10,5', '2000000', '5.00', '1000001'])('"%s" é inválido', (texto) => {
    expect(interpretarMeta(texto)).toEqual({ ok: false })
  })
})
