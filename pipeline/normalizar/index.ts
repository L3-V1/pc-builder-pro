import type { Categoria } from '../../src/catalogo'
import { normalizarArmazenamento } from './armazenamento'
import { normalizarCooler } from './cooler'
import { normalizarCpu } from './cpu'
import { normalizarFonte } from './fonte'
import { normalizarGabinete } from './gabinete'
import { normalizarGpu } from './gpu'
import { normalizarPlacaMae } from './placaMae'
import { normalizarRam } from './ram'
import type { Normalizacao } from './tipos'

export type { Normalizacao, Normalizada } from './tipos'

export const NORMALIZADORES: { [C in Categoria]: (registro: unknown) => Normalizacao<C> } = {
  cpu: normalizarCpu,
  'placa-mae': normalizarPlacaMae,
  ram: normalizarRam,
  gpu: normalizarGpu,
  armazenamento: normalizarArmazenamento,
  fonte: normalizarFonte,
  gabinete: normalizarGabinete,
  cooler: normalizarCooler,
}
