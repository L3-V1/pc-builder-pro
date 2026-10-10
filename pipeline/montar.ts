import type { Catalogo, Categoria, Indices, Peca } from '../src/catalogo'
import { CATEGORIAS } from '../src/catalogo/schema'
import type { IndicesCpu, IndicesGpu, ParesLegado } from './curadoria/schema'
import { NORMALIZADORES } from './normalizar'
import type { Normalizacao, Normalizada } from './normalizar'
import { texto } from './normalizar/campos'
import { resolverColisoes, slugPeca } from './slug'

export type EntradaMontagem = {
  registros: Partial<Record<Categoria, unknown[]>>
  indices: { cpu: IndicesCpu; gpu: IndicesGpu }
  pares: ParesLegado
  legado: Pick<Catalogo, 'dataReferencia' | 'pecas'>
}

export type RelatorioCategoria = {
  normalizadas: number
  descartadas: Record<string, number>
  // Normalizadas sem par no legado: sem Faixa de preço, ficam fora do Catálogo.
  semPreco: number
  semIndice: string[]
}
export type Relatorio = Record<Categoria, RelatorioCategoria>
export type NaoResolvido = { idAntigo: string; motivo: string }

export class ErroMontagem extends Error {
  readonly naoResolvidos: NaoResolvido[]
  readonly relatorio: Relatorio
  constructor(naoResolvidos: NaoResolvido[], relatorio: Relatorio) {
    super(
      `IDs antigos sem Peça no Catálogo:\n${naoResolvidos
        .map((n) => `- ${n.idAntigo}: ${n.motivo}`)
        .join('\n')}`,
    )
    this.name = 'ErroMontagem'
    this.naoResolvidos = naoResolvidos
    this.relatorio = relatorio
  }
}

const relatorioVazio = (): Relatorio =>
  Object.fromEntries(
    CATEGORIAS.map((c) => [c, { normalizadas: 0, descartadas: {}, semPreco: 0, semIndice: [] }]),
  ) as unknown as Relatorio

// Por opendb_id, inclusive as descartadas: o motivo explica um ID antigo que não resolve.
function normalizar(entrada: EntradaMontagem, relatorio: Relatorio): Map<string, Normalizacao> {
  const pareados = new Set(entrada.pares.map((p) => p.opendbId))
  const porId = new Map<string, Normalizacao>()
  for (const categoria of CATEGORIAS) {
    const doRelatorio = relatorio[categoria]
    for (const registro of entrada.registros[categoria] ?? []) {
      const opendbId = texto(registro, 'opendb_id') ?? ''
      const r = NORMALIZADORES[categoria](registro)
      porId.set(opendbId, r)
      if (!r.ok) {
        doRelatorio.descartadas[r.motivo] = (doRelatorio.descartadas[r.motivo] ?? 0) + 1
        continue
      }
      doRelatorio.normalizadas++
      if (!pareados.has(opendbId)) doRelatorio.semPreco++
    }
  }
  return porId
}

type Completada = { ok: true; peca: Peca } | { ok: false; motivo: string }

function completar(n: Normalizada, antiga: Peca, entrada: EntradaMontagem): Completada {
  const { opendbId: _opendbId, chave = '', ...specs } = n
  const comum = { id: slugPeca(n.categoria, n.marca, n.nome), faixaPreco: antiga.faixaPreco }
  if (specs.categoria === 'cpu') {
    const curado = entrada.indices.cpu[chave]
    if (!curado) return { ok: false, motivo: `sem Índice: ${chave}` }
    const { indiceVideoIntegrado, ...indices }: { indiceVideoIntegrado?: Indices } & Indices =
      curado
    const video = specs.videoIntegrado ? { indiceVideoIntegrado } : {}
    return { ok: true, peca: { ...comum, ...specs, indices, ...video } as Peca }
  }
  if (specs.categoria === 'gpu') {
    const curado = entrada.indices.gpu[chave]
    if (!curado) return { ok: false, motivo: `sem Índice: ${chave}` }
    const { fonteRecomendadaW, ...indices } = curado
    return { ok: true, peca: { ...comum, ...specs, fonteRecomendadaW, indices } }
  }
  return { ok: true, peca: { ...comum, ...specs } as Peca }
}

export type SaidaMontagem = { catalogo: Catalogo; relatorio: Relatorio }

export function montarCatalogo(entrada: EntradaMontagem): SaidaMontagem {
  const relatorio = relatorioVazio()
  const porOpendbId = normalizar(entrada, relatorio)
  const parDe = new Map(entrada.pares.map((p) => [p.idAntigo, p.opendbId]))
  const naoResolvidos: NaoResolvido[] = []
  const montadas: { idAntigo: string; opendbId: string; peca: Peca }[] = []
  for (const antiga of entrada.legado.pecas) {
    const opendbId = parDe.get(antiga.id)
    if (opendbId === undefined) {
      naoResolvidos.push({ idAntigo: antiga.id, motivo: 'sem par na curadoria' })
      continue
    }
    const normalizacao = porOpendbId.get(opendbId)
    if (!normalizacao?.ok) {
      const motivo = normalizacao
        ? `descartada: ${normalizacao.motivo}`
        : `opendb_id não encontrado: ${opendbId}`
      naoResolvidos.push({ idAntigo: antiga.id, motivo })
      continue
    }
    const n = normalizacao.peca
    const r = completar(n, antiga, entrada)
    if (r.ok) {
      montadas.push({ idAntigo: antiga.id, opendbId, peca: r.peca })
      continue
    }
    relatorio[n.categoria].semIndice.push(n.chave ?? '')
    naoResolvidos.push({ idAntigo: antiga.id, motivo: r.motivo })
  }
  if (naoResolvidos.length > 0) throw new ErroMontagem(naoResolvidos, relatorio)
  const comIds = resolverColisoes(montadas.map((m) => ({ ...m, id: m.peca.id })))
  const pecas = comIds.map((m) => ({ ...m.peca, id: m.id }))
  const aliases = Object.fromEntries(comIds.map((m) => [m.idAntigo, m.id]))
  return { catalogo: { dataReferencia: entrada.legado.dataReferencia, aliases, pecas }, relatorio }
}
