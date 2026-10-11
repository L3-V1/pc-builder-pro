import { describe, expect, it } from 'vitest'
import { formatarDataReferencia, formatarReais } from './formatar'

describe('formatarReais', () => {
  it('formata em reais pt-BR', () => {
    expect(formatarReais(1100).replace(/\s/g, ' ')).toBe('R$ 1.100,00')
  })
})

describe('formatarDataReferencia', () => {
  it('escreve mês por extenso e ano', () => {
    expect(formatarDataReferencia('2026-10')).toBe('outubro de 2026')
  })

  it('com o dia da coleta, escreve dia, mês por extenso e ano', () => {
    expect(formatarDataReferencia('2026-10-11')).toBe('11 de outubro de 2026')
  })
})
