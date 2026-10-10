import { SOCKETS } from '../../src/catalogo/schema'
import { base, exigir, filtrarEnum, ler, textos } from './campos'
import { socket } from './enums'
import type { Normalizacao } from './tipos'

const tipo = (aguaOuAr: unknown) =>
  typeof aguaOuAr === 'boolean' ? (aguaOuAr ? ('water' as const) : ('ar' as const)) : undefined

export function normalizarCooler(registro: unknown): Normalizacao<'cooler'> {
  const brutos = exigir({
    tipo: tipo(ler(registro, 'water_cooled')),
    sockets: textos(registro, 'cpu_sockets'),
  })
  if (!brutos.ok) return brutos
  const { sockets } = brutos.specs
  const suportados = filtrarEnum(sockets, socket, SOCKETS)
  if (suportados.length === 0) {
    return { ok: false, motivo: `socket não suportado: ${sockets.join(', ')}` }
  }
  return {
    ok: true,
    peca: {
      categoria: 'cooler',
      ...base(registro),
      tipo: brutos.specs.tipo,
      socketsSuportados: suportados,
    },
  }
}
