import { base, converter, exigir, inteiro, lista, naoNegativo, texto } from './campos'
import { formFactor, socket, tipoRam } from './enums'
import type { Normalizacao } from './tipos'

// `lanes` do OpenDB descreve o tamanho físico: placas com um x16 elétrico x4 aparecem com 16.
const slotsPcieX16 = (registro: unknown) =>
  lista(registro, 'pcie_slots')
    .filter((s) => inteiro(s, 'lanes') === 16)
    .reduce<number>((total, s) => total + naoNegativo(s, 'quantity'), 0)

// O OpenDB grava 0 quando não sabe (a ASUS A520M-K tem 4 portas e aparece com 0): sem SATA é
// spec faltando.
function portasSata(registro: unknown): number | undefined {
  const total =
    naoNegativo(registro, 'storage_devices.sata_6_gb_s') +
    naoNegativo(registro, 'storage_devices.sata_3_gb_s')
  return total > 0 ? total : undefined
}

// Key M (ou B+M) aceita SSD; key E é do Wi-Fi.
const slotsM2 = (registro: unknown) =>
  lista(registro, 'm2_slots').filter((s) => texto(s, 'key')?.includes('M')).length

export function normalizarPlacaMae(registro: unknown): Normalizacao<'placa-mae'> {
  const brutos = exigir({
    socket: texto(registro, 'socket'),
    'tipo de RAM': texto(registro, 'memory.ram_type'),
    'form factor': texto(registro, 'form_factor'),
    'slots DIMM': inteiro(registro, 'memory.slots'),
    'portas SATA': portasSata(registro),
  })
  if (!brutos.ok) return brutos
  const b = brutos.specs
  const r = converter({
    socket: [b.socket, socket(b.socket)],
    'tipo de RAM': [b['tipo de RAM'], tipoRam(b['tipo de RAM'])],
    'form factor': [b['form factor'], formFactor(b['form factor'])],
  })
  if (!r.ok) return r
  return {
    ok: true,
    peca: {
      categoria: 'placa-mae',
      ...base(registro),
      socket: r.specs.socket,
      tipoRam: r.specs['tipo de RAM'],
      formFactor: r.specs['form factor'],
      slotsDimm: b['slots DIMM'],
      slotsM2: slotsM2(registro),
      slotsPcieX16: slotsPcieX16(registro),
      portasSata: b['portas SATA'],
    },
  }
}
