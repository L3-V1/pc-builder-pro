import { precisaDePlaca } from '../bancada/slots'
import type { Categoria, Peca } from '../catalogo'
import { criarBuild, encaixar } from '../motor'
import type { Build } from '../motor'

export type Remontagem = { build: Build; recusadas: Peca[]; desconhecidos: string[] }

const ORDEM: readonly Categoria[] = [
  'placa-mae',
  'cpu',
  'cooler',
  'ram',
  'armazenamento',
  'gpu',
  'fonte',
  'gabinete',
]

export function resolverIds(
  ids: readonly string[],
  pecas: readonly Peca[],
): { pecas: Peca[]; desconhecidos: string[] } {
  const porId = new Map(pecas.map((p) => [p.id, p]))
  const encontradas: Peca[] = []
  const desconhecidos: string[] = []
  for (const id of ids) {
    const p = porId.get(id)
    if (p) encontradas.push(p)
    else desconhecidos.push(id)
  }
  return { pecas: encontradas, desconhecidos }
}

export function remontarBuild(pecas: readonly Peca[]): { build: Build; recusadas: Peca[] } {
  const ordenadas = [...pecas].sort(
    (a, b) => ORDEM.indexOf(a.categoria) - ORDEM.indexOf(b.categoria),
  )
  let build = criarBuild()
  const recusadas: Peca[] = []
  for (const peca of ordenadas) {
    if (precisaDePlaca(peca) && !build['placa-mae']) {
      recusadas.push(peca)
      continue
    }
    const r = encaixar(build, peca)
    if (!r.ok) {
      recusadas.push(peca)
      continue
    }
    build = r.build
    recusadas.push(...r.removidas)
  }
  return { build, recusadas }
}
