import type { Peca } from '../catalogo'
import type { AcaoBuild } from '../estado/build'
import type { Slot, SlotId } from './slots'

export type OrigemArraste =
  { tipo: 'busca' } | { tipo: 'bandeja'; chave: string } | { tipo: 'slot'; slotId: SlotId }

export type DestinoArraste = { tipo: 'slot'; slot: Slot } | { tipo: 'bandeja' }

export function acaoDoArraste(
  peca: Peca,
  origem: OrigemArraste,
  destino?: DestinoArraste,
): AcaoBuild | undefined {
  if (!destino) return undefined
  if (destino.tipo === 'bandeja') {
    if (origem.tipo === 'slot') return { tipo: 'desencaixar', pecaId: peca.id }
    if (origem.tipo === 'busca') return { tipo: 'guardar', peca }
    return undefined
  }
  if (origem.tipo === 'slot' || destino.slot.categoria !== peca.categoria) return undefined
  if (origem.tipo === 'bandeja') return { tipo: 'encaixar', peca, daBandeja: origem.chave }
  return { tipo: 'encaixar', peca }
}
