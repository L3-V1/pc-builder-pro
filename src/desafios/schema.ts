import { z } from 'zod'
import { CATEGORIAS, indice } from '../catalogo/schema'
import { formatarCaminho } from '../catalogo/validar'
import { metaValida } from '../motor'

export const Desafio = z.strictObject({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'ID deve ser um slug kebab-case'),
  titulo: z.string().min(1),
  descricao: z.string().min(1),
  orcamentoMaximo: z.number().refine(metaValida),
  pontuacaoMinima: z
    .strictObject({ jogos: indice.optional(), produtividade: indice.optional() })
    .refine((p) => p.jogos !== undefined || p.produtividade !== undefined, {
      error: 'Pontuação mínima precisa de ao menos um Perfil',
    })
    .optional(),
  categoriasExigidas: z.array(z.enum(CATEGORIAS)).default([]),
})
export type Desafio = z.infer<typeof Desafio>

export type ErroDesafio = { caminho: string; mensagem: string }

function idsRepetidos(desafios: Desafio[]): ErroDesafio[] {
  const vistos = new Set<string>()
  return desafios.flatMap((desafio, i) => {
    const repetido = vistos.has(desafio.id)
    vistos.add(desafio.id)
    return repetido ? [{ caminho: `[${i}].id`, mensagem: `ID duplicado: "${desafio.id}"` }] : []
  })
}

export function validarDesafios(
  dados: unknown,
): { ok: true; desafios: Desafio[] } | { ok: false; erros: ErroDesafio[] } {
  const resultado = z.array(Desafio).safeParse(dados)
  if (!resultado.success) {
    return {
      ok: false,
      erros: resultado.error.issues.map((issue) => ({
        caminho: formatarCaminho(issue.path),
        mensagem: issue.message,
      })),
    }
  }
  const erros = idsRepetidos(resultado.data)
  return erros.length > 0 ? { ok: false, erros } : { ok: true, desafios: resultado.data }
}
