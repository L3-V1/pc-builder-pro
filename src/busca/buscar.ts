import type { Peca } from '../catalogo'
import { pesquisarPecas } from './filtrar'
import type { FiltrosPesquisa } from './filtrar'

export type BuscarPecas = (filtros: FiltrosPesquisa, signal: AbortSignal) => Promise<Peca[]>

export function criarBuscaLocal(pecas: Peca[]): BuscarPecas {
  return async (filtros, signal) => {
    // Responde num microtask, como uma implementação de verdade; quem cancelou não recebe nada.
    await Promise.resolve()
    if (signal.aborted) throw new DOMException('Busca cancelada', 'AbortError')
    return pesquisarPecas(pecas, filtros)
  }
}
