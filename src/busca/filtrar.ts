import type { Categoria, Peca, Perfil } from '../catalogo'
import type { Slot } from '../bancada/slots'
import type { Build } from '../motor'
import { indiceDaPeca } from '../motor'
import { avaliarPeca } from './avaliar'

export type Ordenacao =
  'relevancia' | 'preco-asc' | 'preco-desc' | 'desempenho-jogos' | 'desempenho-produtividade'

const PERFIL_DA_ORDENACAO: Partial<Record<Ordenacao, Perfil>> = {
  'desempenho-jogos': 'jogos',
  'desempenho-produtividade': 'produtividade',
}

export type FiltrosBusca = {
  texto: string
  categoria?: Categoria
  marcas: string[]
  precoMin?: number
  precoMax?: number
  ordenacao: Ordenacao
  soCompativeis: boolean
}

export const FILTROS_INICIAIS: FiltrosBusca = {
  texto: '',
  marcas: [],
  ordenacao: 'relevancia',
  soCompativeis: false,
}

export function normalizarTexto(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function casaTexto(peca: Peca, texto: string): boolean {
  const termos = normalizarTexto(texto).split(/\s+/).filter(Boolean)
  const alvo = normalizarTexto(`${peca.nome} ${peca.marca}`)
  return termos.every((t) => alvo.includes(t))
}

export type FiltrosPesquisa = Omit<FiltrosBusca, 'soCompativeis'>

export function pesquisarPecas(pecas: Peca[], filtros: FiltrosPesquisa): Peca[] {
  const { texto, categoria, marcas, precoMin, precoMax, ordenacao } = filtros
  const filtradas = pecas.filter(
    (p) =>
      casaTexto(p, texto) &&
      (categoria === undefined || p.categoria === categoria) &&
      (marcas.length === 0 || marcas.includes(p.marca)) &&
      (precoMin === undefined || p.faixaPreco.medio >= precoMin) &&
      (precoMax === undefined || p.faixaPreco.medio <= precoMax),
  )
  if (ordenacao === 'relevancia') return filtradas
  const perfil = PERFIL_DA_ORDENACAO[ordenacao]
  if (perfil) {
    // Peças sem índice (fora CPU e GPU) vão para o fim; toSorted é estável.
    const indice = (p: Peca) => indiceDaPeca(p, perfil) ?? -1
    return filtradas.toSorted((a, b) => indice(b) - indice(a))
  }
  const sinal = ordenacao === 'preco-asc' ? 1 : -1
  return filtradas.toSorted((a, b) => sinal * (a.faixaPreco.medio - b.faixaPreco.medio))
}

export function soCompativeis(build: Build, pecas: Peca[]): Peca[] {
  return pecas.filter((p) => avaliarPeca(build, p).tipo !== 'bloqueada')
}

// Filtrar depois de ordenar preserva a ordem da pesquisa.
export function filtrarPecas(pecas: Peca[], build: Build, filtros: FiltrosBusca): Peca[] {
  const { soCompativeis: compativeis, ...pesquisa } = filtros
  const resultado = pesquisarPecas(pecas, pesquisa)
  return compativeis ? soCompativeis(build, resultado) : resultado
}

export function marcasDisponiveis(pecas: Peca[], categoria?: Categoria): string[] {
  const marcas = pecas
    .filter((p) => categoria === undefined || p.categoria === categoria)
    .map((p) => p.marca)
  return [...new Set(marcas)].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function filtrosDoSlot(slot: Slot): FiltrosBusca {
  return { ...FILTROS_INICIAIS, categoria: slot.categoria, soCompativeis: true }
}
