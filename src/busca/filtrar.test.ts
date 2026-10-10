import { describe, expect, it } from 'vitest'
import { catalogoFixture } from '../teste/catalogo'
import { criarBuild, indiceDaPeca } from '../motor'
import { montar, peca } from '../motor/teste-pecas'
import { slotsDaBancada } from '../bancada/slots'
import {
  FILTROS_INICIAIS,
  filtrarPecas,
  filtrosDoSlot,
  marcasDisponiveis,
  normalizarTexto,
  pesquisarPecas,
  soCompativeis,
} from './filtrar'
import type { FiltrosBusca } from './filtrar'

const { pecas } = catalogoFixture
const vazia = criarBuild()
const buscar = (filtros: Partial<FiltrosBusca>, build = vazia) =>
  filtrarPecas(pecas, build, { ...FILTROS_INICIAIS, ...filtros })
const ids = (lista: { id: string }[]) => lista.map((p) => p.id)
const naoCrescente = (valores: number[]) => valores.every((v, i) => i === 0 || v <= valores[i - 1])

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
    expect(ids(buscar({ texto: 'b650 tomahawk' }))).toEqual(['placa-mae-b650-tomahawk-wifi'])
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
    expect(r.length).toBe(pecas.filter((p) => p.categoria === 'cpu').length)
    expect(buscar({ marcas: ['Intel'], categoria: 'cpu' }).every((p) => p.marca === 'Intel')).toBe(
      true,
    )
    expect(buscar({ marcas: [] }).length).toBe(pecas.length)
  })

  it('precoMin e precoMax filtram pelo médio, inclusive nas bordas; ausentes não limitam', () => {
    const r = buscar({ precoMin: 1100, precoMax: 2300, categoria: 'cpu' })
    expect(ids(r)).toEqual(
      ids(
        pecas.filter(
          (p) => p.categoria === 'cpu' && p.faixaPreco.medio >= 1100 && p.faixaPreco.medio <= 2300,
        ),
      ),
    )
    expect(ids(r)).toContain('cpu-ryzen-5-7600')
    expect(ids(r)).toContain('cpu-ryzen-7-7800x3d')
    expect(buscar({ precoMax: 250 }).every((p) => p.faixaPreco.medio <= 250)).toBe(true)
    expect(buscar({ precoMin: 22000 }).map((p) => p.id)).toEqual(['gpu-rtx-5090'])
  })

  it('ordena por menor e maior preço médio; empate mantém a ordem do Catálogo', () => {
    const asc = buscar({ ordenacao: 'preco-asc', categoria: 'fonte' })
    const precos = asc.map((p) => p.faixaPreco.medio)
    expect(precos).toEqual(precos.toSorted((a, b) => a - b))
    const desc = buscar({ ordenacao: 'preco-desc' })
    expect(desc[0].id).toBe('gpu-rtx-5090')
    // CX550 e GP650 custam o mesmo; a CX550 vem antes no Catálogo.
    const empatados = ids(asc.filter((p) => p.faixaPreco.medio === 330))
    expect(empatados).toEqual(['fonte-cx550', 'fonte-gamemax-gp650'])
    const iguais = buscar({ ordenacao: 'preco-asc', precoMin: 250, precoMax: 250 })
    expect(ids(iguais)).toEqual(ids(pecas.filter((p) => p.faixaPreco.medio === 250)))
  })

  it('desempenho em Jogos ordena CPUs e GPUs pelo índice, decrescente, e põe o resto no fim', () => {
    const r = buscar({ ordenacao: 'desempenho-jogos' })
    const comIndice = pecas.filter((p) => p.categoria === 'cpu' || p.categoria === 'gpu')
    const topo = r.slice(0, comIndice.length)
    expect(topo[0].id).toBe('cpu-ryzen-7-9800x3d')
    expect(naoCrescente(topo.map((p) => indiceDaPeca(p, 'jogos') ?? -1))).toBe(true)
    const semIndice = pecas.filter((p) => p.categoria !== 'cpu' && p.categoria !== 'gpu')
    expect(ids(r.slice(comIndice.length))).toEqual(ids(semIndice))
  })

  it('desempenho em Produtividade usa o índice de Produtividade', () => {
    const r = buscar({ ordenacao: 'desempenho-produtividade', categoria: 'cpu' })
    expect(r[0].id).toBe('cpu-ryzen-9-9950x')
    expect(naoCrescente(r.map((p) => indiceDaPeca(p, 'produtividade') ?? -1))).toBe(true)
  })

  it('ordenar por desempenho com o filtro de Categoria GPU devolve só GPUs, ordenadas', () => {
    const r = buscar({ ordenacao: 'desempenho-jogos', categoria: 'gpu' })
    expect(r.every((p) => p.categoria === 'gpu')).toBe(true)
    expect(r.length).toBe(pecas.filter((p) => p.categoria === 'gpu').length)
    expect(r[0].id).toBe('gpu-rtx-5090')
    expect(naoCrescente(r.map((p) => indiceDaPeca(p, 'jogos') ?? -1))).toBe(true)
  })

  it('só compatíveis esconde CPUs de outro socket e mantém todas as placas-mãe', () => {
    const build = montar(peca('placa-mae-b650m-aorus-elite', 'placa-mae'))
    const cpus = buscar({ soCompativeis: true, categoria: 'cpu' }, build)
    expect(cpus.every((p) => p.categoria === 'cpu' && p.socket === 'AM5')).toBe(true)
    expect(cpus.length).toBe(
      pecas.filter((p) => p.categoria === 'cpu' && p.socket === 'AM5').length,
    )
    const placas = buscar({ soCompativeis: true, categoria: 'placa-mae' }, build)
    expect(placas.length).toBe(pecas.filter((p) => p.categoria === 'placa-mae').length)
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
    expect(ids(r)).toEqual([
      'fonte-corsair-hx1200i',
      'fonte-corsair-rm1000e',
      'fonte-rm850x',
      'fonte-rm750e',
      'fonte-cx650',
    ])
  })
})

describe('pesquisarPecas', () => {
  it('aplica texto, Categoria, marca, preço e ordenação sem depender de Build', () => {
    const r = pesquisarPecas(pecas, {
      texto: 'corsair',
      categoria: 'fonte',
      marcas: ['Corsair'],
      precoMin: 400,
      ordenacao: 'preco-desc',
    })
    expect(ids(r)).toEqual([
      'fonte-corsair-hx1200i',
      'fonte-corsair-rm1000e',
      'fonte-rm850x',
      'fonte-rm750e',
      'fonte-cx650',
    ])
  })
})

describe('soCompativeis', () => {
  it('remove só as Peças bloqueadas pela Build e preserva a ordem', () => {
    const build = montar(peca('placa-mae-b650m-aorus-elite', 'placa-mae'))
    const entrada = pecas.filter((p) => p.categoria === 'cpu').toReversed()
    const esperado = entrada.filter((p) => p.socket === 'AM5')
    expect(esperado.length).toBeLessThan(entrada.length)
    expect(ids(soCompativeis(build, entrada))).toEqual(ids(esperado))
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

describe('filtrosDoSlot', () => {
  const slots = slotsDaBancada(montar(peca('placa-mae-b650m-aorus-elite', 'placa-mae')))
  const doSlot = (id: string) => {
    const s = slots.find((x) => x.id === id)
    if (!s) throw new Error(`sem Slot ${id}`)
    return filtrosDoSlot(s)
  }

  it('de um Slot DIMM filtra RAM compatível e mantém o resto dos filtros iniciais', () => {
    expect(doSlot('dimm-2')).toEqual({ ...FILTROS_INICIAIS, categoria: 'ram', soCompativeis: true })
  })

  it('dos Slots M.2 e SATA filtra armazenamento', () => {
    expect(doSlot('m2-1').categoria).toBe('armazenamento')
    expect(doSlot('sata').categoria).toBe('armazenamento')
  })
})
