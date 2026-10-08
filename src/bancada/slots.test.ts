import { describe, expect, it } from 'vitest'
import { criarBuild } from '../motor'
import { montar, peca } from '../motor/teste-pecas'
import { precisaDePlaca, slotsDaBancada } from './slots'
import type { Slot } from './slots'

const placaAm5 = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const ramA = peca('ram-corsair-32gb-ddr5-6000', 'ram')
const ramB = peca('ram-kingston-16gb-ddr5-5200', 'ram')
const ocupantes = (slots: Slot[], id: string) =>
  slots.find((s) => s.id === id)?.ocupantes.map((p) => p.id)
const ids = (slots: Slot[]) => slots.map((s) => s.id)

describe('slotsDaBancada', () => {
  it('Build vazia tem apenas gabinete, fonte e placa-mãe, vazios', () => {
    const slots = slotsDaBancada(criarBuild())
    expect(slots.map((s) => s.id)).toEqual(['gabinete', 'fonte', 'placa-mae'])
    expect(slots.every((s) => s.ocupantes.length === 0)).toBe(true)
  })

  it('com placa-mãe aparecem cpu, cooler, DIMMs, M.2, gpu e sata', () => {
    expect(ids(slotsDaBancada(montar(placaAm5)))).toEqual([
      'gabinete',
      'fonte',
      'placa-mae',
      'cpu',
      'cooler',
      'dimm-1',
      'dimm-2',
      'dimm-3',
      'dimm-4',
      'm2-1',
      'm2-2',
      'gpu',
      'sata',
    ])
  })

  it('placa sem PCIe x16 não tem Slot gpu', () => {
    const semPcie = { ...placaAm5, slotsPcieX16: 0 }
    expect(ids(slotsDaBancada(montar(semPcie)))).not.toContain('gpu')
  })

  it('um kit de 2 módulos ocupa dimm-1 e dimm-2, e o segundo kit começa em dimm-3', () => {
    const slots = slotsDaBancada(montar(placaAm5, ramA, ramB))
    expect(ocupantes(slots, 'dimm-1')).toEqual([ramA.id])
    expect(ocupantes(slots, 'dimm-2')).toEqual([ramA.id])
    expect(ocupantes(slots, 'dimm-3')).toEqual([ramB.id])
    expect(ocupantes(slots, 'dimm-4')).toEqual([ramB.id])
  })

  it('armazenamento M.2 ocupa m2-1, m2-2... e o 2.5 vai para a zona sata', () => {
    const nvme1 = peca('armazenamento-nvme-1tb', 'armazenamento')
    const nvme2 = peca('armazenamento-nvme-2tb', 'armazenamento')
    const sata1 = peca('armazenamento-sata-480gb', 'armazenamento')
    const sata2 = peca('armazenamento-sata-1tb', 'armazenamento')
    const slots = slotsDaBancada(montar(placaAm5, sata1, nvme1, sata2, nvme2))
    expect(ocupantes(slots, 'm2-1')).toEqual([nvme1.id])
    expect(ocupantes(slots, 'm2-2')).toEqual([nvme2.id])
    expect(ocupantes(slots, 'sata')).toEqual([sata1.id, sata2.id])
  })
})

describe('precisaDePlaca', () => {
  it('é verdadeiro para cpu, cooler, ram, gpu e armazenamento e falso para o resto', () => {
    const exigem = [
      peca('cpu-ryzen-5-7600', 'cpu'),
      peca('cooler-deepcool-ak400', 'cooler'),
      ramA,
      peca('gpu-rtx-4060', 'gpu'),
      peca('armazenamento-nvme-1tb', 'armazenamento'),
    ]
    const livres = [
      peca('gabinete-nzxt-h5-flow', 'gabinete'),
      peca('fonte-cx650', 'fonte'),
      placaAm5,
    ]
    expect(exigem.every(precisaDePlaca)).toBe(true)
    expect(livres.some(precisaDePlaca)).toBe(false)
  })
})
