import { describe, expect, it } from 'vitest'
import { furyDdr5 as fury, ryzen5600 as ryzen, rx6600 } from '../teste/normalizadas'
import type { Anuncio } from './anuncios'
import { filtrarAnuncios } from './filtro'

let id = 0
const anuncio = (titulo: string, preco: number, mudar: Partial<Anuncio> = {}): Anuncio => ({
  id: `MLB${++id}`,
  titulo,
  preco,
  condicao: 'novo',
  ...mudar,
})

describe('filtrarAnuncios', () => {
  it('descarta Anúncios usados e recondicionados com o motivo "usado"', () => {
    const novo = anuncio('Processador AMD Ryzen 5 5600 AM4', 650)
    const r = filtrarAnuncios(ryzen, [
      novo,
      anuncio('Processador AMD Ryzen 5 5600 AM4', 400, { condicao: 'usado' }),
      anuncio('Processador AMD Ryzen 5 5600 AM4', 450, { condicao: 'recondicionado' }),
    ])
    expect(r).toEqual({ validos: [novo], descartes: { usado: 2 } })
  })
  it('descarta kit, combo e múltiplas unidades com o motivo "kit"', () => {
    const r = filtrarAnuncios(ryzen, [
      anuncio('Kit Processador AMD Ryzen 5 5600 + Cooler', 900),
      anuncio('Combo Upgrade Ryzen 5 5600 + Placa Mãe B550', 1500),
      anuncio('Processador Ryzen 5 5600 - 2 Unidades', 1300),
      anuncio('Processador AMD Ryzen 5 5600', 1300, { quantidadeKit: 2 }),
    ])
    expect(r).toEqual({ validos: [], descartes: { kit: 4 } })
  })

  it('aceita "kit" no título quando a Peça é um kit de RAM com mais de um módulo', () => {
    const kit = anuncio('Memória Kingston Fury Beast Kit 16GB (2x8GB) DDR5 5200MHz', 400)
    expect(filtrarAnuncios(fury, [kit])).toEqual({ validos: [kit], descartes: {} })
  })

  it('descarta título sem os tokens do modelo da CPU com o motivo "modelo diferente"', () => {
    const certo = anuncio('Processador Amd Ryzen 5 5600, 6 Núcleos, AM4', 650)
    const r = filtrarAnuncios(ryzen, [
      certo,
      anuncio('Processador AMD Ryzen 5 5600X AM4', 700),
      anuncio('Processador AMD Ryzen 7 5700', 800),
    ])
    expect(r).toEqual({ validos: [certo], descartes: { 'modelo diferente': 2 } })
  })

  it('descarta variante da GPU ausente da Peça (RX 6600 XT para RX 6600)', () => {
    const certo = anuncio('Placa De Vídeo Asrock Rx 6600 Challenger D 8gb', 1300)
    const r = filtrarAnuncios(rx6600, [
      certo,
      anuncio('Placa De Vídeo Asrock Rx 6600 XT Challenger D 8gb', 1600),
      anuncio('Placa De Vídeo Rx 6650 Xt 8gb', 1600),
    ])
    expect(r).toEqual({ validos: [certo], descartes: { 'modelo diferente': 2 } })
  })

  it('descarta outliers fora de [0,5×, 2×] da mediana dos demais com o motivo "outlier"', () => {
    const titulo = 'Processador AMD Ryzen 5 5600'
    // mediana de 320, 650, 660, 700 e 1400 = 660 → aceita de 330 a 1320
    const meio = [anuncio(titulo, 650), anuncio(titulo, 660), anuncio(titulo, 700)]
    const r = filtrarAnuncios(ryzen, [
      anuncio(titulo, 320),
      ...meio,
      anuncio(titulo, 1400),
      anuncio(titulo, 100, { condicao: 'usado' }),
    ])
    expect(r).toEqual({ validos: meio, descartes: { usado: 1, outlier: 2 } })
  })
})
