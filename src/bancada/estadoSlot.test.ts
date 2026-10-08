import { describe, expect, it } from 'vitest'
import type { Build } from '../motor'
import { montar, peca } from '../motor/teste-pecas'
import { estadoDoSlot } from './estadoSlot'
import { slotsDaBancada } from './slots'
import type { SlotId } from './slots'

const placaAm5 = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const cpuAm5 = peca('cpu-ryzen-5-7600', 'cpu')

const slotDe = (build: Build, id: SlotId) => {
  const s = slotsDaBancada(build).find((x) => x.id === id)
  if (!s) throw new Error(`Slot ${id} não existe`)
  return s
}

describe('estadoDoSlot', () => {
  it('Slot de outra Categoria fica neutro', () => {
    const build = montar(placaAm5)
    expect(estadoDoSlot(build, slotDe(build, 'dimm-1'), cpuAm5)).toBe('neutro')
  })

  it('CPU AM5 no socket de placa AM5 fica compativel, e CPU LGA1700 fica bloqueado', () => {
    const build = montar(placaAm5)
    const socket = slotDe(build, 'cpu')
    expect(estadoDoSlot(build, socket, cpuAm5)).toBe('compativel')
    expect(estadoDoSlot(build, socket, peca('cpu-core-i5-12400', 'cpu'))).toBe('bloqueado')
  })

  it('RAM DDR4 em DIMM de placa DDR5 fica bloqueado, e um kit que excede os DIMMs também', () => {
    const ddr5 = peca('ram-corsair-32gb-ddr5-6000', 'ram')
    const vazia = montar(placaAm5)
    expect(
      estadoDoSlot(vazia, slotDe(vazia, 'dimm-1'), peca('ram-corsair-16gb-ddr4-3200', 'ram')),
    ).toBe('bloqueado')
    const cheia = montar(placaAm5, ddr5, ddr5)
    expect(estadoDoSlot(cheia, slotDe(cheia, 'dimm-1'), ddr5)).toBe('bloqueado')
  })

  it('gabinete que não aceita o form factor da placa fica bloqueado', () => {
    const build = montar(peca('placa-mae-b650-tomahawk-wifi', 'placa-mae'))
    expect(
      estadoDoSlot(build, slotDe(build, 'gabinete'), peca('gabinete-kmex-matx', 'gabinete')),
    ).toBe('bloqueado')
  })

  it('outra CPU compatível no socket ocupado fica compativel, e a mesma CPU fica neutro', () => {
    const build = montar(placaAm5, cpuAm5)
    const socket = slotDe(build, 'cpu')
    expect(estadoDoSlot(build, socket, peca('cpu-ryzen-7-7800x3d', 'cpu'))).toBe('compativel')
    expect(estadoDoSlot(build, socket, cpuAm5)).toBe('neutro')
  })
})
