import { base, converter, exigir, inteiro, texto } from './campos'
import { tipoRam } from './enums'
import type { Normalizacao } from './tipos'

// Só módulo de desktop: "288-pin DIMM", "UDIMM"; SO-DIMM é de notebook.
const dimmDesktop = (ff: string) => (/DIMM/.test(ff) && !/SO-?DIMM/i.test(ff) ? ff : undefined)

function capacidade(registro: unknown): number | undefined {
  const total = inteiro(registro, 'capacity')
  if (total) return total
  const quantidade = inteiro(registro, 'modules.quantity')
  const porModulo = inteiro(registro, 'modules.capacity_gb')
  return quantidade && porModulo ? quantidade * porModulo : undefined
}

export function normalizarRam(registro: unknown): Normalizacao<'ram'> {
  const brutos = exigir({
    'tipo de RAM': texto(registro, 'ram_type'),
    'form factor': texto(registro, 'form_factor'),
    capacidade: capacidade(registro),
    módulos: inteiro(registro, 'modules.quantity'),
    frequência: inteiro(registro, 'speed'),
  })
  if (!brutos.ok) return brutos
  const b = brutos.specs
  const r = converter({
    'tipo de RAM': [b['tipo de RAM'], tipoRam(b['tipo de RAM'])],
    'form factor': [b['form factor'], dimmDesktop(b['form factor'])],
  })
  if (!r.ok) return r
  return {
    ok: true,
    peca: {
      categoria: 'ram',
      ...base(registro),
      tipoRam: r.specs['tipo de RAM'],
      capacidadeTotalGB: b.capacidade,
      modulos: b.módulos,
      frequenciaMHz: b.frequência,
    },
  }
}
