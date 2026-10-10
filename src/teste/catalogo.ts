import type { Catalogo } from '../catalogo'
import { validarCatalogo } from '../catalogo/validar'
import fixture from './catalogo.json'
import { respostaDados } from './respostaDados'

export { respostaDados }

function validar(entrada: unknown): Catalogo {
  const resultado = validarCatalogo(entrada)
  if (!resultado.ok) {
    const detalhes = resultado.erros.map((e) => `${e.caminho}: ${e.mensagem}`).join('\n')
    throw new Error(`Fixture do Catálogo inválida:\n${detalhes}`)
  }
  return resultado.catalogo
}

// Recorte congelado do Catálogo real: os dados publicados mudam sem quebrar os testes.
export const catalogoFixture: Catalogo = validar(fixture)

const arquivoDaUrl = (url: string) => /dados\/([^/]+)\.json$/.exec(url)?.[1]

export const buscarFixture: typeof fetch = async (entrada) => {
  const url = entrada instanceof Request ? entrada.url : String(entrada)
  const arquivo = arquivoDaUrl(url)
  if (!arquivo) return new Response(null, { status: 404 })
  return Response.json(respostaDados(arquivo))
}
