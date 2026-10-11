import type { Categoria } from '../../src/catalogo'
import type { IndicesCpu, IndicesGpu, Selecao } from '../curadoria/schema'
import type { Normalizada } from '../normalizar'

type IndicesCurados = { cpu: IndicesCpu; gpu: IndicesGpu }

// CPU e GPU só entram no Catálogo com Índice: consultar sem ele gastaria requisições à toa.
function temIndice(peca: Normalizada, indices: IndicesCurados): boolean {
  if (peca.categoria === 'cpu') return indices.cpu[peca.chave ?? ''] !== undefined
  if (peca.categoria === 'gpu') return indices.gpu[peca.chave ?? ''] !== undefined
  return true
}

// Peças cujos Anúncios serão consultados. As legadas (com par na curadoria) sempre entram;
// as novas passam pela lista de marcas e pelo teto de consultas da Categoria, na ordem do OpenDB.
export function selecionarCandidatas(
  normalizadas: Normalizada[],
  selecao: Selecao,
  indices: IndicesCurados,
  pareados: Set<string>,
): Normalizada[] {
  const marcas = new Map(
    Object.entries(selecao.categorias).map(([c, s]) => [
      c,
      new Set(s.marcas.map((m) => m.toLowerCase())),
    ]),
  )
  const consultas = new Map<Categoria, number>()
  return normalizadas.filter((peca) => {
    if (pareados.has(peca.opendbId)) return true
    const usadas = consultas.get(peca.categoria) ?? 0
    const aceita =
      temIndice(peca, indices) &&
      (marcas.get(peca.categoria)?.has(peca.marca.toLowerCase()) ?? false) &&
      usadas < selecao.categorias[peca.categoria].tetoConsultas
    if (aceita) consultas.set(peca.categoria, usadas + 1)
    return aceita
  })
}

// Sem sinal de popularidade antes da coleta, o número de Anúncios válidos faz esse papel:
// por Categoria, ficam as N novas com mais Anúncios, além de todas as legadas.
export function aplicarTeto<T extends { peca: Normalizada; nAnuncios: number }>(
  precificadas: T[],
  teto: Record<Categoria, number>,
  pareados: Set<string>,
): T[] {
  const mantidas = new Set<T>()
  for (const categoria of Object.keys(teto) as Categoria[]) {
    precificadas
      .filter((p) => p.peca.categoria === categoria && !pareados.has(p.peca.opendbId))
      .toSorted((a, b) => b.nAnuncios - a.nAnuncios)
      .slice(0, teto[categoria])
      .forEach((p) => mantidas.add(p))
  }
  return precificadas.filter((p) => pareados.has(p.peca.opendbId) || mantidas.has(p))
}
