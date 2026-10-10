/// <reference types="node" />
import { readFileSync } from 'node:fs'
import type { Catalogo } from '../catalogo'
import { ARQUIVOS_DADOS } from '../catalogo/carregar'
import { validarCatalogo } from '../catalogo/validar'

// Relativo a este arquivo, para não depender do diretório de onde o Vitest roda.
const pasta = new URL('../../public/dados/', import.meta.url)
const ler = (arquivo: string): unknown =>
  JSON.parse(readFileSync(new URL(`${arquivo}.json`, pasta), 'utf8'))

// Lê os dados reais publicados em public/dados/: só os testes dos dados usam isto.
export function lerCatalogoPublicado(): Catalogo {
  const meta = ler('meta') as { dataReferencia: unknown }
  const resultado = validarCatalogo({
    dataReferencia: meta.dataReferencia,
    pecas: ARQUIVOS_DADOS.flatMap((arquivo) => ler(arquivo) as unknown[]),
  })
  if (!resultado.ok) {
    const detalhes = resultado.erros.map((e) => `${e.caminho}: ${e.mensagem}`).join('\n')
    throw new Error(`Catálogo publicado inválido:\n${detalhes}`)
  }
  return resultado.catalogo
}
