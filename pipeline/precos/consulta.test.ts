import { describe, expect, it } from 'vitest'
import { ryzen5600 as cpu, rx6600 } from '../teste/normalizadas'
import { textoBusca } from './consulta'

describe('textoBusca', () => {
  it('na GPU usa a marca da placa e o chipset', () => {
    expect(textoBusca(rx6600)).toBe('ASRock Radeon RX 6600')
  })

  it('na CPU usa marca e nome sem repetir a marca', () => {
    expect(textoBusca(cpu)).toBe('AMD Ryzen 5 5600')
    expect(textoBusca({ ...cpu, nome: 'AMD Ryzen 5 5600' })).toBe('AMD Ryzen 5 5600')
  })
})
