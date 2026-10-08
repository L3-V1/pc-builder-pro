import type { Build } from './build'
import type { Incompatibilidade } from './compatibilidade'

/** Estimativa do resto da Build (placa-mãe, RAM, discos, ventoinhas). */
export const CONSUMO_RESTANTE_W = 100
export const MARGEM_FONTE_PADRAO = 0.3

export function consumoEstimadoW(build: Build): number {
  return (build.cpu?.consumoW ?? 0) + (build.gpu?.consumoW ?? 0) + CONSUMO_RESTANTE_W
}

export function verificarFonte(
  build: Build,
  margem = MARGEM_FONTE_PADRAO,
): Incompatibilidade | undefined {
  if (margem < 0) throw new RangeError('A margem da fonte não pode ser negativa.')
  const { fonte, gpu } = build
  if (!fonte) return undefined
  const necessaria = Math.max(
    Math.ceil(consumoEstimadoW(build) * (1 + margem)),
    gpu?.fonteRecomendadaW ?? 0,
  )
  if (fonte.potenciaW >= necessaria) return undefined
  return {
    regra: 'fonte',
    severidade: 'alerta',
    pecas: gpu ? [fonte.id, gpu.id] : [fonte.id],
    mensagem: `A fonte de ${fonte.potenciaW} W pode ser insuficiente: o recomendado para esta Build é ${necessaria} W.`,
  }
}
