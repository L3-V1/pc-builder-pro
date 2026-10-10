import { FORM_FACTORS } from '../../src/catalogo/schema'
import { base, exigir, filtrarEnum, textos } from './campos'
import { formFactor } from './enums'
import type { Normalizacao } from './tipos'

export function normalizarGabinete(registro: unknown): Normalizacao<'gabinete'> {
  const brutos = exigir({ 'form factors': textos(registro, 'supported_motherboard_form_factors') })
  if (!brutos.ok) return brutos
  const lista = brutos.specs['form factors']
  const suportados = filtrarEnum(lista, formFactor, FORM_FACTORS)
  if (suportados.length === 0) {
    return { ok: false, motivo: `form factor não suportado: ${lista.join(', ')}` }
  }
  return {
    ok: true,
    peca: {
      categoria: 'gabinete',
      ...base(registro),
      formFactorsSuportados: suportados,
    },
  }
}
