import type { Peca, PecaDe } from '../catalogo'
import { pecasIncompativeisComPlaca, verificarEncaixe } from './compatibilidade'
import type { Incompatibilidade } from './compatibilidade'

export type CategoriaUnica = 'cpu' | 'placa-mae' | 'gpu' | 'fonte' | 'gabinete' | 'cooler'

export type Build = Readonly<{ [C in CategoriaUnica]?: PecaDe<C> }> & {
  readonly ram: readonly PecaDe<'ram'>[]
  readonly armazenamento: readonly PecaDe<'armazenamento'>[]
}

export type ResultadoEncaixe =
  { ok: true; build: Build; removidas: Peca[] } | { ok: false; bloqueios: Incompatibilidade[] }

const CATEGORIAS_UNICAS: readonly CategoriaUnica[] = [
  'cpu',
  'placa-mae',
  'gpu',
  'fonte',
  'gabinete',
  'cooler',
]

export function criarBuild(): Build {
  return { ram: [], armazenamento: [] }
}

export function pecasDaBuild(build: Build): Peca[] {
  const unicas = CATEGORIAS_UNICAS.flatMap((c) => {
    const p = build[c]
    return p ? [p] : []
  })
  return [...unicas, ...build.ram, ...build.armazenamento]
}

export function encaixar(build: Build, peca: Peca): ResultadoEncaixe {
  if (peca.categoria === 'placa-mae') return encaixarPlaca(build, peca)
  const anterior = categoriaUnica(peca) ? build[peca.categoria as CategoriaUnica] : undefined
  const base = anterior ? remover(build, anterior.id) : build
  const bloqueios = verificarEncaixe(base, peca)
  if (bloqueios.length > 0) return { ok: false, bloqueios }
  return { ok: true, build: acrescentar(base, peca), removidas: anterior ? [anterior] : [] }
}

function categoriaUnica(peca: Peca): boolean {
  return peca.categoria !== 'ram' && peca.categoria !== 'armazenamento'
}

function acrescentar(build: Build, peca: Peca): Build {
  if (peca.categoria === 'ram') return { ...build, ram: [...build.ram, peca] }
  if (peca.categoria === 'armazenamento') {
    return { ...build, armazenamento: [...build.armazenamento, peca] }
  }
  return { ...build, [peca.categoria]: peca }
}

function encaixarPlaca(build: Build, placa: PecaDe<'placa-mae'>): ResultadoEncaixe {
  const anterior = build['placa-mae']
  const deslocadas = pecasIncompativeisComPlaca(build, placa)
  const base = deslocadas.reduce((b, p) => remover(b, p.id), build)
  return {
    ok: true,
    build: acrescentar(base, placa),
    removidas: [...(anterior ? [anterior] : []), ...deslocadas],
  }
}

function semUltima<T extends Peca>(lista: readonly T[], id: string): readonly T[] {
  const i = lista.map((p) => p.id).lastIndexOf(id)
  return i < 0 ? lista : lista.filter((_, j) => j !== i)
}

export function remover(build: Build, pecaId: string): Build {
  const resto: Partial<Record<CategoriaUnica, Peca>> = { ...build }
  for (const c of CATEGORIAS_UNICAS) {
    if (build[c]?.id === pecaId) delete resto[c]
  }
  return {
    ...(resto as Build),
    ram: semUltima(build.ram, pecaId),
    armazenamento: semUltima(build.armazenamento, pecaId),
  }
}
