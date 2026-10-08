import { z } from 'zod'
import type { EstadoBuild } from '../estado/build'
import { metaValida, pecasDaBuild } from '../motor'

export const CHAVE_ESTADO = 'pc-builder-pro:estado'

const EstadoSalvo = z.object({
  versao: z.literal(1),
  build: z.array(z.string()),
  bandeja: z.array(z.string()),
  meta: z.number().refine(metaValida).optional(),
})
export type EstadoSalvo = z.infer<typeof EstadoSalvo>

export function serializarEstado(estado: EstadoBuild): EstadoSalvo {
  return {
    versao: 1,
    build: pecasDaBuild(estado.build).map((p) => p.id),
    bandeja: estado.bandeja.map((i) => i.peca.id),
    ...(estado.meta === undefined ? {} : { meta: estado.meta }),
  }
}

export function lerEstadoSalvo(storage: Pick<Storage, 'getItem'>): EstadoSalvo | undefined {
  let dados: unknown
  try {
    const texto = storage.getItem(CHAVE_ESTADO)
    if (texto === null) return undefined
    dados = JSON.parse(texto)
  } catch {
    return undefined
  }
  const resultado = EstadoSalvo.safeParse(dados)
  return resultado.success ? resultado.data : undefined
}

// Modo privado ou cota cheia: o app segue funcionando, só sem salvar.
export function salvarEstado(storage: Pick<Storage, 'setItem'>, estado: EstadoBuild): void {
  try {
    storage.setItem(CHAVE_ESTADO, JSON.stringify(serializarEstado(estado)))
  } catch {
    // ignorado de propósito
  }
}
