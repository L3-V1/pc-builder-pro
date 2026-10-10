import { describe, expect, it } from 'vitest'
import { socket } from './enums'

describe('socket', () => {
  it.each([
    ['LGA 1700', 'LGA1700'],
    ['LGA 1851', 'LGA1851'],
    ['AM4', 'AM4'],
    ['AM5', 'AM5'],
  ])('converte "%s" em %s', (entrada, esperado) => {
    expect(socket(entrada)).toBe(esperado)
  })

  it.each(['AM3', 'LGA 1151', 'sTR5', '2 x LGA 2011', '', undefined])(
    'devolve indefinido para socket fora do app: %s',
    (entrada) => {
      expect(socket(entrada)).toBeUndefined()
    },
  )
})
