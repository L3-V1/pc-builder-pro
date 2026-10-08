import type { FaixaPreco } from '../catalogo'
import { pecasDaBuild } from './build'
import type { Build } from './build'

export function calcularOrcamento(build: Build): FaixaPreco | { min: 0; medio: 0; max: 0 } {
  const total = { min: 0, medio: 0, max: 0 }
  for (const { faixaPreco } of pecasDaBuild(build)) {
    total.min += faixaPreco.min
    total.medio += faixaPreco.medio
    total.max += faixaPreco.max
  }
  return total
}
