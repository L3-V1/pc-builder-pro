import type { Categoria, Peca } from '../catalogo'
import type { Build } from '../motor'
import { avaliarPeca } from './avaliar'

export type Ordenacao = 'relevancia' | 'preco-asc' | 'preco-desc'

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

export function filtrarPecas(pecas: Peca[], build: Build, filtros: FiltrosBusca): Peca[] {
  const { texto, categoria, marcas, precoMin, precoMax, ordenacao, soCompativeis } = filtros
  const filtradas = pecas.filter(
    (p) =>
      casaTexto(p, texto) &&
      (categoria === undefined || p.categoria === categoria) &&
      (marcas.length === 0 || marcas.includes(p.marca)) &&
      (precoMin === undefined || p.faixaPreco.medio >= precoMin) &&
      (precoMax === undefined || p.faixaPreco.medio <= precoMax) &&
      (!soCompativeis || avaliarPeca(build, p).tipo !== 'bloqueada'),
  )
  if (ordenacao === 'relevancia') return filtradas
  const sinal = ordenacao === 'preco-asc' ? 1 : -1
  return filtradas.toSorted((a, b) => sinal * (a.faixaPreco.medio - b.faixaPreco.medio))
}

export function marcasDisponiveis(pecas: Peca[], categoria?: Categoria): string[] {
  const marcas = pecas
    .filter((p) => categoria === undefined || p.categoria === categoria)
    .map((p) => p.marca)
  return [...new Set(marcas)].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
