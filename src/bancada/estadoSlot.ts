import type { Peca } from '../catalogo'
import { avaliarPeca } from '../busca'
import type { Build } from '../motor'
import type { Slot } from './slots'

export type EstadoSlot = 'neutro' | 'compativel' | 'bloqueado'

export function estadoDoSlot(build: Build, slot: Slot, peca: Peca): EstadoSlot {
  if (slot.categoria !== peca.categoria) return 'neutro'
  const avaliacao = avaliarPeca(build, peca)
  if (avaliacao.tipo === 'na-build') return 'neutro'
  return avaliacao.tipo === 'bloqueada' ? 'bloqueado' : 'compativel'
}
