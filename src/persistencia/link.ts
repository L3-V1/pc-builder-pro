import { metaValida } from '../motor'

export type DadosLink = { ids: string[]; meta?: number; invalidos: number }

const TOKEN = /^([a-z0-9-]+)(?:\*([2-8]))?$/

export function codificarLink(ids: readonly string[], meta?: number): string {
  const contagem = new Map<string, number>()
  for (const id of ids) contagem.set(id, (contagem.get(id) ?? 0) + 1)
  const tokens = [...contagem].map(([id, n]) => (n === 1 ? id : `${id}*${n}`))
  const partes: string[] = []
  if (tokens.length > 0) partes.push(`b=${tokens.join(',')}`)
  if (meta !== undefined) partes.push(`m=${meta}`)
  return partes.join('&')
}

function lerTokens(b: string): { ids: string[]; invalidos: number } {
  const ids: string[] = []
  let invalidos = 0
  for (const token of b.split(',')) {
    const casou = TOKEN.exec(token)
    if (!casou) {
      invalidos++
      continue
    }
    const [, id, n] = casou
    ids.push(...Array<string>(n === undefined ? 1 : Number(n)).fill(id))
  }
  return { ids, invalidos }
}

function lerMeta(m: string | null): number | undefined {
  if (m === null || !/^\d+$/.test(m)) return undefined
  const valor = Number(m)
  return metaValida(valor) ? valor : undefined
}

export function decodificarLink(hash: string): DadosLink | undefined {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const b = params.get('b')
  const { ids, invalidos } = b ? lerTokens(b) : { ids: [], invalidos: 0 }
  const meta = lerMeta(params.get('m'))
  if (ids.length === 0 && meta === undefined) return undefined
  return { ids, ...(meta === undefined ? {} : { meta }), invalidos }
}
