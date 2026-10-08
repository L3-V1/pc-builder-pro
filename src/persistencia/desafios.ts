import { z } from 'zod'
import type { EstadoApp } from '../estado/app'
import { gravarChave, lerChave, serializarEstado } from './armazenamento'

export const CHAVE_DESAFIOS = 'pc-builder-pro:desafios'

const DesafiosSalvos = z.object({
  versao: z.literal(1),
  tela: z.enum(['livre', 'desafios', 'desafio']),
  desafioAtivo: z.string().optional(),
  progresso: z.record(
    z.string(),
    z.object({ build: z.array(z.string()), bandeja: z.array(z.string()) }),
  ),
  concluidos: z.array(z.string()),
})
export type DesafiosSalvos = z.infer<typeof DesafiosSalvos>

function serializarDesafios(estado: EstadoApp): DesafiosSalvos {
  const progresso = Object.fromEntries(
    Object.entries(estado.progresso).map(([id, build]) => {
      const { build: ids, bandeja } = serializarEstado(build)
      return [id, { build: ids, bandeja }]
    }),
  )
  return {
    versao: 1,
    tela: estado.tela,
    ...(estado.desafioAtivo === undefined ? {} : { desafioAtivo: estado.desafioAtivo }),
    progresso,
    concluidos: estado.concluidos,
  }
}

export function lerDesafiosSalvos(storage: Pick<Storage, 'getItem'>): DesafiosSalvos | undefined {
  return lerChave(storage, CHAVE_DESAFIOS, DesafiosSalvos)
}

export function salvarDesafios(storage: Pick<Storage, 'setItem'>, estado: EstadoApp): void {
  gravarChave(storage, CHAVE_DESAFIOS, serializarDesafios(estado))
}
