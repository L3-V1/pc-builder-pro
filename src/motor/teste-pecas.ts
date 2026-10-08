import { carregarCatalogo } from '../catalogo'
import type { Categoria, Peca, PecaDe } from '../catalogo'
import { criarBuild, encaixar } from './build'
import type { Build } from './build'

export function peca<C extends Categoria>(id: string, categoria: C): PecaDe<C> {
  const encontrada = carregarCatalogo().pecas.find((p) => p.id === id)
  if (!encontrada) throw new Error(`Peça "${id}" não existe no Catálogo`)
  if (encontrada.categoria !== categoria) {
    throw new Error(`Peça "${id}" é ${encontrada.categoria}, não ${categoria}`)
  }
  return encontrada as PecaDe<C>
}

export function montar(...pecas: Peca[]): Build {
  return pecas.reduce((build, p) => {
    const r = encaixar(build, p)
    if (!r.ok) throw new Error(`Encaixe de "${p.id}" bloqueado no setup do teste`)
    return r.build
  }, criarBuild())
}
