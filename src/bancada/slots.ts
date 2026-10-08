import type { Categoria, Peca } from '../catalogo'
import type { Build } from '../motor'

export type SlotId =
  | 'gabinete'
  | 'fonte'
  | 'placa-mae'
  | 'cpu'
  | 'cooler'
  | 'gpu'
  | 'sata'
  | `dimm-${number}`
  | `m2-${number}`

export type Slot = { id: SlotId; categoria: Categoria; rotulo: string; ocupantes: Peca[] }

export const CATEGORIAS_DA_PLACA: readonly Categoria[] = [
  'cpu',
  'cooler',
  'ram',
  'gpu',
  'armazenamento',
]

export function precisaDePlaca(peca: Peca): boolean {
  return CATEGORIAS_DA_PLACA.includes(peca.categoria)
}

const slot = (id: SlotId, categoria: Categoria, rotulo: string, ocupantes: Peca[]): Slot => ({
  id,
  categoria,
  rotulo,
  ocupantes,
})

const ocupado = (peca: Peca | undefined): Peca[] => (peca ? [peca] : [])

const repetir = <T>(n: number, f: (i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => f(i))

export function slotsDaBancada(build: Build): Slot[] {
  const placa = build['placa-mae']
  const fixos = [
    slot('gabinete', 'gabinete', 'Gabinete', ocupado(build.gabinete)),
    slot('fonte', 'fonte', 'Fonte', ocupado(build.fonte)),
    slot('placa-mae', 'placa-mae', 'Placa-mãe', ocupado(placa)),
  ]
  if (!placa) return fixos

  const dimms = build.ram.flatMap((kit) => repetir(kit.modulos, () => kit))
  const m2 = build.armazenamento.filter((a) => a.formato === 'M.2')
  const sata = build.armazenamento.filter((a) => a.formato === '2.5')
  return [
    ...fixos,
    slot('cpu', 'cpu', 'Socket da CPU', ocupado(build.cpu)),
    slot('cooler', 'cooler', 'Cooler', ocupado(build.cooler)),
    ...repetir(placa.slotsDimm, (i) =>
      slot(`dimm-${i + 1}`, 'ram', `Slot DIMM ${i + 1}`, ocupado(dimms[i])),
    ),
    ...repetir(placa.slotsM2, (i) =>
      slot(`m2-${i + 1}`, 'armazenamento', `Slot M.2 ${i + 1}`, ocupado(m2[i])),
    ),
    ...(placa.slotsPcieX16 > 0 ? [slot('gpu', 'gpu', 'Slot PCIe x16', ocupado(build.gpu))] : []),
    slot('sata', 'armazenamento', 'Discos SATA', sata),
  ]
}
