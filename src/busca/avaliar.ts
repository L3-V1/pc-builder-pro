import type { Peca } from '../catalogo'
import { encaixar, pecasIncompativeisComPlaca } from '../motor'
import type { Build, CategoriaUnica, Incompatibilidade } from '../motor'

export type AvaliacaoPeca =
  | { tipo: 'bloqueada'; bloqueios: Incompatibilidade[] }
  | { tipo: 'na-build' }
  | { tipo: 'livre'; substitui?: Peca; desloca: Peca[] }

export function avaliarPeca(build: Build, peca: Peca): AvaliacaoPeca {
  const atual = pecaUnicaAtual(build, peca)
  if (atual?.id === peca.id) return { tipo: 'na-build' }

  const resultado = encaixar(build, peca)
  if (!resultado.ok) return { tipo: 'bloqueada', bloqueios: resultado.bloqueios }

  const desloca = peca.categoria === 'placa-mae' ? pecasIncompativeisComPlaca(build, peca) : []
  return atual ? { tipo: 'livre', substitui: atual, desloca } : { tipo: 'livre', desloca }
}

function pecaUnicaAtual(build: Build, peca: Peca): Peca | undefined {
  if (peca.categoria === 'ram' || peca.categoria === 'armazenamento') return undefined
  return build[peca.categoria as CategoriaUnica]
}
