import { describe, expect, it } from 'vitest'
import { carregarCatalogo } from '../catalogo'
import { criarBuild } from '../motor'
import { montar, peca } from '../motor/teste-pecas'
import { FILTROS_INICIAIS, filtrarPecas, marcasDisponiveis, normalizarTexto } from './filtrar'
import type { FiltrosBusca } from './filtrar'

const { pecas } = carregarCatalogo()
const vazia = criarBuild()
const buscar = (filtros: Partial<FiltrosBusca>, build = vazia) =>
  filtrarPecas(pecas, build, { ...FILTROS_INICIAIS, ...filtros })
const ids = (lista: { id: string }[]) => lista.map((p) => p.id)

describe('normalizarTexto', () => {
  it('passa para minúsculas e remove acentos', () => {
    expect(normalizarTexto('Placa-MÃE Ção')).toBe('placa-mae cao')
  })
})

describe('filtrarPecas', () => {
  it('filtros iniciais devolvem todo o Catálogo na ordem original', () => {
    expect(ids(buscar({}))).toEqual(ids(pecas))
  })

  it('texto casa nome e marca, sem diferenciar maiúsculas e acentos, com todos os termos', () => {
    expect(ids(buscar({ texto: 'ryzen 7600' }))).toEqual(['cpu-ryzen-5-7600'])
    expect(ids(buscar({ texto: 'RYZEN' })).length).toBeGreaterThan(1)
    const corsair = buscar({ texto: 'corsair' }).map((p) => p.categoria)
    expect(new Set(corsair)).toEqual(new Set(['ram', 'fonte', 'gabinete', 'cooler']))
    expect(ids(buscar({ texto: 'tomahawk' }))).toEqual(['placa-mae-b650-tomahawk-wifi'])
  })

  it('texto sem resultado devolve lista vazia', () => {
    expect(buscar({ texto: 'xyzinexistente' })).toEqual([])
  })

  it('filtro de Categoria restringe à Categoria', () => {
    const r = buscar({ categoria: 'gpu' })
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((p) => p.categoria === 'gpu')).toBe(true)
  })

  it('filtro de marcas aceita várias; vazio não filtra', () => {
    const r = buscar({ marcas: ['AMD', 'Intel'], categoria: 'cpu' })
    expect(r.length).toBe(6)
    expect(buscar({ marcas: ['Intel'], categoria: 'cpu' }).every((p) => p.marca === 'Intel')).toBe(
      true,
    )
    expect(buscar({ marcas: [] }).length).toBe(pecas.length)
  })

  it('precoMin e precoMax filtram pelo médio, inclusive nas bordas; ausentes não limitam', () => {
    const r = buscar({ precoMin: 1100, precoMax: 2300, categoria: 'cpu' })
    expect(ids(r)).toEqual(['cpu-ryzen-5-7600', 'cpu-ryzen-7-7800x3d'])
    expect(buscar({ precoMax: 250 }).every((p) => p.faixaPreco.medio <= 250)).toBe(true)
    expect(buscar({ precoMin: 4300 }).map((p) => p.id)).toEqual(['gpu-rtx-4070-super'])
  })

  it('ordena por menor e maior preço médio; empate mantém a ordem do Catálogo', () => {
    const asc = buscar({ ordenacao: 'preco-asc', categoria: 'fonte' })
    expect(asc.map((p) => p.faixaPreco.medio)).toEqual([230, 330, 400, 750, 1000])
    const desc = buscar({ ordenacao: 'preco-desc' })
    expect(desc[0].id).toBe('gpu-rtx-4070-super')
    const empatados = buscar({ ordenacao: 'preco-asc', categoria: 'armazenamento' })
    expect(ids(empatados).slice(0, 2)).toEqual([
      'armazenamento-sata-480gb',
      'armazenamento-nvme-500gb',
    ])
    const iguais = buscar({ ordenacao: 'preco-asc', precoMin: 250, precoMax: 250 })
    expect(ids(iguais)).toEqual(ids(pecas.filter((p) => p.faixaPreco.medio === 250)))
  })

  it('só compatíveis esconde CPUs de outro socket e mantém todas as placas-mãe', () => {
    const build = montar(peca('placa-mae-b650m-aorus-elite', 'placa-mae'))
    const cpus = buscar({ soCompativeis: true, categoria: 'cpu' }, build)
    expect(cpus.every((p) => p.categoria === 'cpu' && p.socket === 'AM5')).toBe(true)
    expect(cpus.length).toBe(2)
    const placas = buscar({ soCompativeis: true, categoria: 'placa-mae' }, build)
    expect(placas.length).toBe(6)
  })

  it('só compatíveis sem placa não esconde nada', () => {
    expect(buscar({ soCompativeis: true }).length).toBe(pecas.length)
  })

  it('combina Categoria, marca, preço e ordenação', () => {
    const r = buscar({
      categoria: 'fonte',
      marcas: ['Corsair'],
      precoMin: 400,
      ordenacao: 'preco-desc',
    })
    expect(ids(r)).toEqual(['fonte-rm850x', 'fonte-rm750e', 'fonte-cx650'])
  })
})

describe('marcasDisponiveis', () => {
  it('devolve marcas únicas e ordenadas, restritas à Categoria quando informada', () => {
    expect(marcasDisponiveis(pecas, 'cpu')).toEqual(['AMD', 'Intel'])
    const todas = marcasDisponiveis(pecas)
    expect(todas).toEqual([...new Set(todas)].sort((a, b) => a.localeCompare(b, 'pt-BR')))
    expect(todas).toContain('Corsair')
    expect(todas).toContain('AMD')
  })
})
