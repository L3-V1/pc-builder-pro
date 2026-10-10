import { z } from 'zod'
import { indice } from '../../src/catalogo/schema'

const Indices = z.strictObject({ jogos: indice, produtividade: indice })

// Chave: modelo da CPU sem a marca, em kebab-case (ex.: "ryzen-5-5600").
export const IndicesCpu = z.record(
  z.string(),
  z.strictObject({ ...Indices.shape, indiceVideoIntegrado: Indices.optional() }),
)
export type IndicesCpu = z.infer<typeof IndicesCpu>

// Chave: `chipset` do OpenDB (ex.: "GeForce RTX 4060").
export const IndicesGpu = z.record(
  z.string(),
  z.strictObject({ ...Indices.shape, fonteRecomendadaW: z.number().int().positive() }),
)
export type IndicesGpu = z.infer<typeof IndicesGpu>

function semRepetidos(campo: 'idAntigo' | 'opendbId', rotulo: string) {
  return (pares: { idAntigo: string; opendbId: string }[], ctx: z.RefinementCtx) => {
    const vistos = new Set<string>()
    pares.forEach((par, i) => {
      const valor = par[campo]
      if (vistos.has(valor)) {
        ctx.addIssue({
          code: 'custom',
          message: `${rotulo} repetido: "${valor}"`,
          path: [i, campo],
        })
      }
      vistos.add(valor)
    })
  }
}

// Liga cada ID do Catálogo antigo a um registro do OpenDB: dele vêm preço e alias.
export const ParesLegado = z
  .array(z.strictObject({ idAntigo: z.string().min(1), opendbId: z.string().min(1) }))
  .superRefine(semRepetidos('opendbId', 'opendb_id'))
  .superRefine(semRepetidos('idAntigo', 'ID antigo'))
export type ParesLegado = z.infer<typeof ParesLegado>
