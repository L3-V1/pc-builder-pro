import type { Peca } from '../catalogo'
import { FORM_FACTORS } from '../catalogo/schema'

export type VariacaoVisual = { cor: string; tamanho: 'p' | 'm' | 'g'; forma?: string }

export const PALETA: readonly string[] = [
  '#4f6d8f',
  '#8f4f5e',
  '#4f8f6a',
  '#8f7a4f',
  '#6a4f8f',
  '#4f8a8f',
  '#8f5f3f',
  '#5e6b4f',
]

function hash(texto: string): number {
  let h = 0
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

type Tamanho = VariacaoVisual['tamanho']

const POR_FORM_FACTOR: Record<(typeof FORM_FACTORS)[number], Tamanho> = {
  ATX: 'g',
  'Micro-ATX': 'm',
  'Mini-ITX': 'p',
}

const porFaixa = (valor: number, ateP: number, ateM: number): Tamanho =>
  valor <= ateP ? 'p' : valor <= ateM ? 'm' : 'g'

function tamanho(peca: Peca): Tamanho {
  if (peca.categoria === 'placa-mae') return POR_FORM_FACTOR[peca.formFactor]
  if (peca.categoria === 'gpu') return porFaixa(peca.consumoW, 120, 220)
  if (peca.categoria === 'fonte') return porFaixa(peca.potenciaW, 550, 750)
  if (peca.categoria === 'gabinete') {
    const maior = FORM_FACTORS.find((f) => peca.formFactorsSuportados.includes(f))
    return maior ? POR_FORM_FACTOR[maior] : 'm'
  }
  return 'm'
}

function forma(peca: Peca): string | undefined {
  if (peca.categoria === 'cooler') return peca.tipo
  if (peca.categoria === 'armazenamento') return peca.formato
  return undefined
}

export function variacaoVisual(peca: Peca): VariacaoVisual {
  const variacao: VariacaoVisual = {
    cor: PALETA[hash(peca.marca) % PALETA.length],
    tamanho: tamanho(peca),
  }
  const f = forma(peca)
  return f ? { ...variacao, forma: f } : variacao
}
