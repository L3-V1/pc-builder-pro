import type { FaixaPreco } from '../catalogo'

export type SituacaoMeta =
  | { tipo: 'dentro'; falta: number; percentual: number; excessoNoMaximo?: number }
  | { tipo: 'acima'; excesso: number; percentual: number }

export function situacaoMeta(orcamento: FaixaPreco, meta: number): SituacaoMeta {
  const percentual = (orcamento.medio / meta) * 100
  if (orcamento.medio > meta) return { tipo: 'acima', excesso: orcamento.medio - meta, percentual }
  const dentro = { tipo: 'dentro' as const, falta: meta - orcamento.medio, percentual }
  return orcamento.max > meta ? { ...dentro, excessoNoMaximo: orcamento.max - meta } : dentro
}

export function metaValida(valor: number): boolean {
  return Number.isInteger(valor) && valor >= 1 && valor <= 1_000_000
}

const INTEIRO_COM_MILHAR = /^(\d+|\d{1,3}(\.\d{3})+)$/

export function interpretarMeta(texto: string): { ok: true; valor?: number } | { ok: false } {
  const limpo = texto.trim()
  if (limpo === '') return { ok: true }
  if (!INTEIRO_COM_MILHAR.test(limpo)) return { ok: false }
  const valor = Number(limpo.replaceAll('.', ''))
  return metaValida(valor) ? { ok: true, valor } : { ok: false }
}
