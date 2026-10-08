import { describe, expect, it } from 'vitest'
import type { Build } from '../motor'
import { criarBuild } from '../motor'
import { montar, peca } from '../motor/teste-pecas'
import { acaoDoArraste } from './arraste'
import type { DestinoArraste } from './arraste'
import { slotsDaBancada } from './slots'
import type { SlotId } from './slots'

const placaAm5 = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const cpu = peca('cpu-ryzen-5-7600', 'cpu')
const comPlaca = montar(placaAm5)

const noSlot = (build: Build, id: SlotId): DestinoArraste => {
  const slot = slotsDaBancada(build).find((s) => s.id === id)
  if (!slot) throw new Error(`Slot ${id} não existe`)
  return { tipo: 'slot', slot }
}
const naBandeja: DestinoArraste = { tipo: 'bandeja' }

describe('acaoDoArraste', () => {
  it('busca → Slot vira encaixar, e busca → Bandeja vira guardar', () => {
    expect(acaoDoArraste(cpu, { tipo: 'busca' }, noSlot(comPlaca, 'cpu'))).toEqual({
      tipo: 'encaixar',
      peca: cpu,
    })
    expect(acaoDoArraste(cpu, { tipo: 'busca' }, naBandeja)).toEqual({ tipo: 'guardar', peca: cpu })
  })

  it('Bandeja → Slot vira encaixar com daBandeja', () => {
    expect(acaoDoArraste(cpu, { tipo: 'bandeja', chave: 'b7' }, noSlot(comPlaca, 'cpu'))).toEqual({
      tipo: 'encaixar',
      peca: cpu,
      daBandeja: 'b7',
    })
  })

  it('Slot → Bandeja vira desencaixar', () => {
    expect(acaoDoArraste(cpu, { tipo: 'slot', slotId: 'cpu' }, naBandeja)).toEqual({
      tipo: 'desencaixar',
      pecaId: cpu.id,
    })
  })

  it('sem destino, Bandeja → Bandeja e Slot → Slot retornam undefined', () => {
    expect(acaoDoArraste(cpu, { tipo: 'busca' })).toBeUndefined()
    expect(acaoDoArraste(cpu, { tipo: 'bandeja', chave: 'b1' }, naBandeja)).toBeUndefined()
    expect(
      acaoDoArraste(cpu, { tipo: 'slot', slotId: 'cpu' }, noSlot(comPlaca, 'cpu')),
    ).toBeUndefined()
  })

  it('soltar num Slot de outra Categoria retorna undefined', () => {
    expect(acaoDoArraste(cpu, { tipo: 'busca' }, noSlot(comPlaca, 'dimm-1'))).toBeUndefined()
    expect(
      acaoDoArraste(cpu, { tipo: 'bandeja', chave: 'b1' }, noSlot(criarBuild(), 'fonte')),
    ).toBeUndefined()
  })
})
