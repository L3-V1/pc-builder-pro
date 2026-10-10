import { base, converter, exigir, inteiro, texto } from './campos'
import { certificacao } from './enums'
import type { Normalizacao } from './tipos'

export function normalizarFonte(registro: unknown): Normalizacao<'fonte'> {
  const brutos = exigir({
    potência: inteiro(registro, 'wattage'),
    certificação: texto(registro, 'efficiency_rating'),
  })
  if (!brutos.ok) return brutos
  const b = brutos.specs
  const r = converter({ certificação: [b.certificação, certificacao(b.certificação)] })
  if (!r.ok) return r
  return {
    ok: true,
    peca: {
      categoria: 'fonte',
      ...base(registro),
      potenciaW: b.potência,
      certificacao: r.specs.certificação,
    },
  }
}
