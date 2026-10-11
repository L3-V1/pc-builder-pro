import type { Catalogo, Categoria, FaixaPreco, Indices, Peca } from '../src/catalogo'
import { CATEGORIAS } from '../src/catalogo/schema'
import type { IndicesCpu, IndicesGpu, ParesLegado } from './curadoria/schema'
import { NORMALIZADORES } from './normalizar'
import type { Normalizacao, Normalizada } from './normalizar'
import { texto } from './normalizar/campos'
import { resolverColisoes, slugPeca } from './slug'

// Resultado da coleta de uma Peça: sem Faixa quando não teve Anúncios válidos suficientes.
export type PrecoColetado = {
  faixa: FaixaPreco | null
  nAnuncios: number
  descartes: Record<string, number>
}

export type EntradaMontagem = {
  registros: Partial<Record<Categoria, unknown[]>>
  indices: { cpu: IndicesCpu; gpu: IndicesGpu }
  pares: ParesLegado
  legado: Pick<Catalogo, 'dataReferencia' | 'pecas'>
  // Sem coleta (`--sem-coleta`): só as legadas, com a Faixa e a Data de referência legadas.
  coleta?: { data: string; precos: Map<string, PrecoColetado> }
}

export type RelatorioCategoria = {
  normalizadas: number
  descartadas: Record<string, number>
  // Normalizadas sem par no legado e não consultadas: sem Faixa de preço, ficam fora.
  semPreco: number
  semIndice: string[]
  // Com Faixa de preço coletada no Mercado Livre (legadas e novas).
  comPreco: number
  // Anúncios descartados pelo filtro, somados por motivo.
  descartesAnuncio: Record<string, number>
  // Novas consultadas no Mercado Livre sem Anúncios válidos suficientes: ficam fora.
  semAnuncio: number
  // IDs antigos que ficaram sem Anúncio válido e mantêm a Faixa legada (a Fase 13 troca por
  // fora de venda).
  precoLegado: string[]
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
    CATEGORIAS.map((c) => [
      c,
      {
        normalizadas: 0,
        descartadas: {},
        semPreco: 0,
        semIndice: [],
        comPreco: 0,
        descartesAnuncio: {},
        semAnuncio: 0,
        precoLegado: [],
      },
    ]),
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
      const preco = entrada.coleta?.precos.get(opendbId)
      if (!pareados.has(opendbId) && !preco) doRelatorio.semPreco++
      if (!preco) continue
      if (preco.faixa) doRelatorio.comPreco++
      for (const [motivo, n] of Object.entries(preco.descartes))
        doRelatorio.descartesAnuncio[motivo] = (doRelatorio.descartesAnuncio[motivo] ?? 0) + n
    }
  }
  return porId
}

type Completada = { ok: true; peca: Peca } | { ok: false; motivo: string }

function completar(n: Normalizada, faixaPreco: FaixaPreco, entrada: EntradaMontagem): Completada {
  const { opendbId: _opendbId, chave = '', ...specs } = n
  const comum = { id: slugPeca(n.categoria, n.marca, n.nome), faixaPreco }
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

// Peças sem par no legado que a coleta precificou, na ordem da coleta.
function montarNovas(
  entrada: EntradaMontagem,
  porOpendbId: Map<string, Normalizacao>,
  relatorio: Relatorio,
): { opendbId: string; peca: Peca }[] {
  const pareados = new Set(entrada.pares.map((p) => p.opendbId))
  const novas: { opendbId: string; peca: Peca }[] = []
  for (const [opendbId, preco] of entrada.coleta?.precos ?? []) {
    const normalizacao = porOpendbId.get(opendbId)
    if (pareados.has(opendbId) || !normalizacao?.ok) continue
    if (!preco.faixa) {
      relatorio[normalizacao.peca.categoria].semAnuncio++
      continue
    }
    const r = completar(normalizacao.peca, preco.faixa, entrada)
    if (r.ok) novas.push({ opendbId, peca: r.peca })
  }
  return novas
}

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
    const coletada = entrada.coleta?.precos.get(opendbId)?.faixa
    const r = completar(n, coletada ?? antiga.faixaPreco, entrada)
    if (r.ok) {
      montadas.push({ idAntigo: antiga.id, opendbId, peca: r.peca })
      if (entrada.coleta && !coletada) relatorio[n.categoria].precoLegado.push(antiga.id)
      continue
    }
    relatorio[n.categoria].semIndice.push(n.chave ?? '')
    naoResolvidos.push({ idAntigo: antiga.id, motivo: r.motivo })
  }
  if (naoResolvidos.length > 0) throw new ErroMontagem(naoResolvidos, relatorio)
  const novas = montarNovas(entrada, porOpendbId, relatorio)
  const comIds = resolverColisoes([...montadas, ...novas].map((m) => ({ ...m, id: m.peca.id })))
  const pecas = comIds.map((m) => ({ ...m.peca, id: m.id }))
  const dataReferencia = entrada.coleta?.data ?? entrada.legado.dataReferencia
  const aliases = Object.fromEntries(
    comIds.flatMap((m) => ('idAntigo' in m ? [[m.idAntigo, m.id]] : [])),
  )
  return { catalogo: { dataReferencia, aliases, pecas }, relatorio }
}
