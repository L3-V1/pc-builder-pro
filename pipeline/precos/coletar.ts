import type { Categoria } from '../../src/catalogo'
import type { IndicesCpu, IndicesGpu, Selecao } from '../curadoria/schema'
import type { PrecoColetado } from '../montar'
import type { Normalizada } from '../normalizar'
import type { BuscarAnuncios } from './anuncios'
import { textoBusca } from './consulta'
import { calcularFaixa } from './faixa'
import { filtrarAnuncios } from './filtro'
import { aplicarTeto, selecionarCandidatas } from './selecao'

export type EntradaColeta = {
  normalizadas: Normalizada[]
  selecao: Selecao
  indices: { cpu: IndicesCpu; gpu: IndicesGpu }
  pareados: Set<string>
  buscar: BuscarAnuncios
}

export type Coleta = { precos: Map<string, PrecoColetado>; consultadas: number }

// Seleção → consulta → filtro → Faixa → teto. As sem Faixa continuam no mapa para o relatório
// (semAnuncio, precoLegado); as cortadas pelo teto saem.
export async function coletar(entrada: EntradaColeta): Promise<Coleta> {
  const { selecao, pareados } = entrada
  const candidatas = selecionarCandidatas(entrada.normalizadas, selecao, entrada.indices, pareados)
  // A concorrência é limitada pelo cliente: aqui todas as consultas saem de uma vez.
  const precificadas = await Promise.all(
    candidatas.map(async (peca) => {
      const { validos, descartes } = filtrarAnuncios(peca, await entrada.buscar(textoBusca(peca)))
      const faixa = calcularFaixa(
        validos.map((a) => a.preco),
        selecao.minimoAnuncios,
      )
      const nAnuncios = validos.length
      return { peca, nAnuncios, preco: { faixa, nAnuncios, descartes } }
    }),
  )
  const teto = Object.fromEntries(
    Object.entries(selecao.categorias).map(([c, s]) => [c, s.tetoFinal]),
  ) as Record<Categoria, number>
  const comFaixa = aplicarTeto(
    precificadas.filter((p) => p.preco.faixa !== null),
    teto,
    pareados,
  )
  const mantidas = new Set(comFaixa.map((p) => p.peca.opendbId))
  const precos = new Map(
    precificadas
      .filter((p) => p.preco.faixa === null || mantidas.has(p.peca.opendbId))
      .map((p) => [p.peca.opendbId, p.preco]),
  )
  return { precos, consultadas: candidatas.length }
}
