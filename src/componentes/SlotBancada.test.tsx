// @vitest-environment jsdom
import { DndContext, useDndContext } from '@dnd-kit/core'
import type { Over } from '@dnd-kit/core'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { anuncios } from '../bancada/anuncios'
import type { Slot } from '../bancada'
import { peca } from '../motor/teste-pecas'
import { SlotBancada } from './SlotBancada'

const cpu = peca('cpu-core-i5-12400', 'cpu')
const socket: Slot = { id: 'cpu', categoria: 'cpu', rotulo: 'Socket da CPU', ocupantes: [] }

function LerDestino({ onLer }: { onLer: (over: Over) => void }) {
  const { droppableContainers } = useDndContext()
  const destino = droppableContainers.get('slot:cpu')
  if (destino)
    onLer({ id: destino.id, data: destino.data, rect: null, disabled: false } as unknown as Over)
  return null
}

describe('SlotBancada', () => {
  it('expõe o estado no droppable para o anúncio dizer que o Slot está bloqueado', () => {
    let over: Over | undefined
    render(
      <DndContext>
        <SlotBancada slot={socket} estado="bloqueado" onDesencaixar={() => {}} />
        <LerDestino onLer={(o) => (over = o)} />
      </DndContext>,
    )
    const active = { id: 'busca:x', data: { current: { peca: cpu } } }
    expect(
      anuncios.onDragEnd({ active, over } as unknown as Parameters<typeof anuncios.onDragEnd>[0]),
    ).toBe(`${cpu.nome} não pode ser encaixada em Socket da CPU.`)
  })
})
