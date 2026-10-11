import { describe, expect, it, vi } from 'vitest'
import { CATEGORIAS } from '../../src/catalogo/schema'
import type { Selecao } from '../curadoria/schema'
import type { Normalizada } from '../normalizar'
import { furyDdr5, ryzen5600, rx6600 } from '../teste/normalizadas'
import type { Anuncio, BuscarAnuncios } from './anuncios'
import { coletar } from './coletar'

const criterio = { marcas: ['AMD', 'ASRock', 'Kingston'], tetoConsultas: 10, tetoFinal: 10 }
const selecao: Selecao = {
  minimoAnuncios: 3,
  categorias: Object.fromEntries(CATEGORIAS.map((c) => [c, criterio])) as Selecao['categorias'],
}
const indices = {
  cpu: { 'ryzen-5-5600': { jogos: 62, produtividade: 26 } },
  gpu: { 'Radeon RX 6600': { jogos: 22, produtividade: 12, fonteRecomendadaW: 450 } },
}
const anuncios = (titulo: string, precos: number[]): Anuncio[] =>
  precos.map((preco, i) => ({ id: `${titulo}-${i}`, titulo, preco, condicao: 'novo' }))

function porta(respostas: Record<string, Anuncio[]>) {
  return vi.fn<BuscarAnuncios>(async (consulta) => respostas[consulta] ?? [])
}

describe('coletar', () => {
  it('consulta cada candidata pelo texto de busca e devolve Faixa, Anúncios válidos e descartes', async () => {
    const buscar = porta({
      'AMD Ryzen 5 5600': [
        ...anuncios('Processador AMD Ryzen 5 5600', [600, 650, 700]),
        ...anuncios('Processador AMD Ryzen 5 5600X', [800]),
      ],
      'ASRock Radeon RX 6600': anuncios('Placa de Vídeo RX 6600', [1200, 1300]),
    })
    const r = await coletar({
      normalizadas: [ryzen5600, rx6600],
      selecao,
      indices,
      pareados: new Set(),
      buscar,
    })
    expect(buscar).toHaveBeenCalledTimes(2)
    expect(r.consultadas).toBe(2)
    expect(r.precos.get(ryzen5600.opendbId)).toEqual({
      faixa: { min: 600, medio: 650, max: 690 },
      nAnuncios: 3,
      descartes: { 'modelo diferente': 1 },
    })
    expect(r.precos.get(rx6600.opendbId)).toEqual({ faixa: null, nAnuncios: 2, descartes: {} })
  })

  it('aplica o teto final às novas com Faixa e mantém as legadas', async () => {
    const outra = { ...rx6600, opendbId: 'outra-rx-6600' } as Normalizada
    const legada = { ...furyDdr5 }
    const ram = anuncios('Memória Kingston Fury Beast DDR5 16GB', [400, 410, 420])
    const um = { ...criterio, tetoFinal: 0 }
    const buscar = porta({
      'ASRock Radeon RX 6600': anuncios('Placa de Vídeo RX 6600', [1200, 1250, 1300, 1350]),
      [`Kingston ${furyDdr5.nome}`]: ram,
    })
    const r = await coletar({
      normalizadas: [rx6600, outra, legada],
      selecao: {
        ...selecao,
        categorias: { ...selecao.categorias, gpu: { ...criterio, tetoFinal: 1 }, ram: um },
      },
      indices,
      pareados: new Set([legada.opendbId]),
      buscar,
    })
    expect([...r.precos.keys()]).toEqual([rx6600.opendbId, legada.opendbId])
  })
})
