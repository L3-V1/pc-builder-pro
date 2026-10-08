import { describe, expect, it } from 'vitest'
import { proximoDestino } from './teclado'
import type { Destino } from './teclado'

const em = (id: string, top: number, left: number): Destino => ({
  id,
  rect: { top, left, width: 10, height: 10 },
})
const destinos = [em('c', 50, 0), em('b', 0, 50), em('a', 0, 0)]

describe('proximoDestino', () => {
  it('segue a ordem de leitura (cima para baixo, esquerda para direita) e dá a volta', () => {
    expect(proximoDestino(destinos, undefined, 1)?.id).toBe('a')
    expect(proximoDestino(destinos, undefined, -1)?.id).toBe('c')
    expect(proximoDestino(destinos, 'a', 1)?.id).toBe('b')
    expect(proximoDestino(destinos, 'c', 1)?.id).toBe('a')
    expect(proximoDestino(destinos, 'a', -1)?.id).toBe('c')
    expect(proximoDestino([], undefined, 1)).toBeUndefined()
  })
})
