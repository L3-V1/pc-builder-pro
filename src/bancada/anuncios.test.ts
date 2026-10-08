import type { Active, Over } from '@dnd-kit/core'
import { describe, expect, it } from 'vitest'
import { peca } from '../motor/teste-pecas'
import { anuncios, instrucoes } from './anuncios'

const cpu = peca('cpu-ryzen-5-7600', 'cpu')
const active = {
  id: 'busca:x',
  data: { current: { peca: cpu, origem: { tipo: 'busca' } } },
} as unknown as Active
const sobre = (rotulo: string) =>
  ({ id: 'slot:cpu', data: { current: { rotulo } } }) as unknown as Over

describe('anúncios do arraste', () => {
  it('falam em pt-BR o nome da Peça e o rótulo do destino', () => {
    expect(instrucoes.draggable).toMatch(/Espaço/)
    expect(anuncios.onDragStart({ active })).toBe('Ryzen 5 7600 pega.')
    expect(anuncios.onDragOver({ active, over: sobre('Socket da CPU') })).toBe(
      'Ryzen 5 7600 sobre Socket da CPU.',
    )
    expect(anuncios.onDragEnd({ active, over: sobre('Bandeja') })).toBe(
      'Ryzen 5 7600 solta em Bandeja.',
    )
    expect(anuncios.onDragEnd({ active, over: null })).toBe(
      'Ryzen 5 7600 solta fora de um destino.',
    )
    expect(anuncios.onDragCancel({ active, over: null })).toBe('Arraste de Ryzen 5 7600 cancelado.')
  })
})
