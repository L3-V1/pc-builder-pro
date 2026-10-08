import dados from './dados/desafios.json'
import { validarDesafios } from './schema'
import type { Desafio } from './schema'

export type { Desafio } from './schema'

let memoizado: Desafio[] | undefined

export function carregarDesafios(): Desafio[] {
  if (memoizado) return memoizado
  const resultado = validarDesafios(dados)
  if (!resultado.ok) {
    const detalhes = resultado.erros.map((e) => `${e.caminho}: ${e.mensagem}`).join('\n')
    throw new Error(`Desafios inválidos:\n${detalhes}`)
  }
  memoizado = resultado.desafios
  return memoizado
}
