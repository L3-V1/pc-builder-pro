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

// Chave ausente, JSON corrompido, formato inválido ou storage que lança: undefined.
export function lerChave<T>(
  storage: Pick<Storage, 'getItem'>,
  chave: string,
  schema: z.ZodType<T>,
): T | undefined {
  let dados: unknown
  try {
    const texto = storage.getItem(chave)
    if (texto === null) return undefined
    dados = JSON.parse(texto)
  } catch {
    return undefined
  }
  const resultado = schema.safeParse(dados)
  return resultado.success ? resultado.data : undefined
}

// Modo privado ou cota cheia: o app segue funcionando, só sem salvar.
export function gravarChave(storage: Pick<Storage, 'setItem'>, chave: string, valor: unknown) {
  try {
    storage.setItem(chave, JSON.stringify(valor))
  } catch {
    // ignorado de propósito
  }
}

export function lerEstadoSalvo(storage: Pick<Storage, 'getItem'>): EstadoSalvo | undefined {
  return lerChave(storage, CHAVE_ESTADO, EstadoSalvo)
}

export function salvarEstado(storage: Pick<Storage, 'setItem'>, estado: EstadoBuild): void {
  gravarChave(storage, CHAVE_ESTADO, serializarEstado(estado))
}
