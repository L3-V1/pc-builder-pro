import { Catalogo } from './schema'

export type ErroCatalogo = { caminho: string; mensagem: string }
export type ResultadoValidacao =
  { ok: true; catalogo: Catalogo } | { ok: false; erros: ErroCatalogo[] }

export function formatarCaminho(caminho: PropertyKey[]): string {
  return caminho.reduce<string>((acc, parte) => {
    if (typeof parte === 'number') return `${acc}[${parte}]`
    return acc ? `${acc}.${String(parte)}` : String(parte)
  }, '')
}

function validarEntrePecas(catalogo: Catalogo): ErroCatalogo[] {
  const erros: ErroCatalogo[] = []
  const vistos = new Set<string>()
  catalogo.pecas.forEach((peca, i) => {
    if (vistos.has(peca.id)) {
      erros.push({ caminho: `pecas[${i}].id`, mensagem: `ID duplicado: "${peca.id}"` })
    }
    vistos.add(peca.id)
    const prefixo = `${peca.categoria}-`
    if (!peca.id.startsWith(prefixo)) {
      erros.push({
        caminho: `pecas[${i}].id`,
        mensagem: `ID "${peca.id}" deve começar com "${prefixo}"`,
      })
    }
  })
  return erros
}

export function validarCatalogo(entrada: unknown): ResultadoValidacao {
  const resultado = Catalogo.safeParse(entrada)
  if (!resultado.success) {
    return {
      ok: false,
      erros: resultado.error.issues.map((issue) => ({
        caminho: formatarCaminho(issue.path),
        mensagem: issue.message,
      })),
    }
  }
  const erros = validarEntrePecas(resultado.data)
  return erros.length > 0 ? { ok: false, erros } : { ok: true, catalogo: resultado.data }
}
