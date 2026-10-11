import { describe, expect, it } from 'vitest'
import { FaixaPreco } from '../../src/catalogo/schema'
import { calcularFaixa } from './faixa'

describe('calcularFaixa', () => {
  it('devolve null com menos Anúncios que o mínimo', () => {
    expect(calcularFaixa([500, 600], 3)).toBeNull()
  })

  it('mín = menor preço, médio = mediana, máx = p90 interpolado, com quantidade ímpar', () => {
    // p90: posição 0,9 × 4 = 3,6 → 400 + 0,6 × (1000 − 400) = 760
    expect(calcularFaixa([1000, 300, 99.9, 400, 200], 3)).toEqual({
      min: 100,
      medio: 300,
      max: 760,
    })
  })

  it('com quantidade par, a mediana é a média dos dois do meio, em reais inteiros', () => {
    // mediana (200 + 301) / 2 = 250,5 → 251; p90: posição 2,7 → 301 + 0,7 × 99 = 370,3 → 370
    expect(calcularFaixa([400, 100, 301, 200], 3)).toEqual({ min: 100, medio: 251, max: 370 })
  })
  it.each([
    [[649.9, 649.9, 649.9]],
    [[0.2, 0.4, 3]],
    [[1999.99, 2000.01, 2000.49, 2000.5]],
    [[100, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000]],
  ])('a Faixa de %j passa no schema FaixaPreco', (precos) => {
    expect(FaixaPreco.safeParse(calcularFaixa(precos, 3)).success).toBe(true)
  })
})
