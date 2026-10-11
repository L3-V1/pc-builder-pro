import { describe, expect, it } from 'vitest'
import type { Categoria } from '../../src/catalogo'
import { CATEGORIAS } from '../../src/catalogo/schema'
import type { Selecao } from '../curadoria/schema'
import type { Normalizada } from '../normalizar'
import { furyDdr5, ryzen5600, rx6600 } from '../teste/normalizadas'
import { aplicarTeto, selecionarCandidatas } from './selecao'

const criterio = { marcas: [], tetoConsultas: 10, tetoFinal: 10 }
const selecao: Selecao = {
  minimoAnuncios: 3,
  categorias: {
    cpu: { ...criterio, marcas: ['AMD', 'Intel'] },
    'placa-mae': criterio,
    ram: { ...criterio, marcas: ['kingston'], tetoConsultas: 1 },
    gpu: { ...criterio, marcas: ['ASRock'] },
    armazenamento: criterio,
    fonte: criterio,
    gabinete: criterio,
    cooler: criterio,
  },
}
const indices = {
  cpu: { 'ryzen-5-5600': { jogos: 62, produtividade: 26 } },
  gpu: { 'Radeon RX 6600': { jogos: 22, produtividade: 12, fonteRecomendadaW: 450 } },
}
const variar = (base: Normalizada, mudar: Record<string, unknown>) =>
  ({ ...base, ...mudar }) as Normalizada
const ids = (pecas: Normalizada[]) => pecas.map((p) => p.opendbId)

describe('selecionarCandidatas', () => {
  it('exclui CPU e GPU sem Índice curado', () => {
    const i5 = variar(ryzen5600, { opendbId: 'i5', marca: 'Intel', chave: 'core-i5-12400' })
    const rtx = variar(rx6600, { opendbId: 'rtx', chave: 'GeForce RTX 4060' })
    const r = selecionarCandidatas([ryzen5600, i5, rx6600, rtx], selecao, indices, new Set())
    expect(ids(r)).toEqual([ryzen5600.opendbId, rx6600.opendbId])
  })

  it('exclui marcas fora da lista, sem diferenciar maiúsculas', () => {
    const corsair = variar(furyDdr5, { opendbId: 'corsair', marca: 'Corsair' })
    const r = selecionarCandidatas([corsair, furyDdr5], selecao, indices, new Set())
    expect(ids(r)).toEqual([furyDdr5.opendbId])
  })

  it('respeita o teto de consultas da Categoria e sempre inclui as legadas', () => {
    const outra = variar(furyDdr5, { opendbId: 'outra' })
    const legada = variar(furyDdr5, { opendbId: 'legada', marca: 'Corsair' })
    const r = selecionarCandidatas([furyDdr5, outra, legada], selecao, indices, new Set(['legada']))
    expect(ids(r)).toEqual([furyDdr5.opendbId, 'legada'])
  })
})

describe('aplicarTeto', () => {
  const precificada = (opendbId: string, nAnuncios: number, base: Normalizada = furyDdr5) => ({
    peca: variar(base, { opendbId }),
    nAnuncios,
  })
  const teto = Object.fromEntries(CATEGORIAS.map((c) => [c, 2])) as Record<Categoria, number>

  it('mantém, por Categoria, as N com mais Anúncios válidos, além das legadas, na ordem original', () => {
    const r = aplicarTeto(
      [
        precificada('a', 3),
        precificada('legada', 1),
        precificada('b', 9),
        precificada('c', 5),
        precificada('cpu', 1, ryzen5600),
      ],
      teto,
      new Set(['legada']),
    )
    expect(r.map((p) => p.peca.opendbId)).toEqual(['legada', 'b', 'c', 'cpu'])
  })
})
