import { readFileSync } from 'node:fs'
import type { Catalogo } from '../src/catalogo'
import { ARQUIVOS_DADOS } from '../src/catalogo/carregar'
import { validarCatalogo } from '../src/catalogo/validar'
import { CAMINHOS } from './config'

const ler = (arquivo: string): unknown =>
  JSON.parse(readFileSync(new URL(`${arquivo}.json`, CAMINHOS.legado), 'utf8'))

// O Catálogo anterior ao pipeline: fonte das Faixas de preço, da Data de referência e dos IDs
// antigos que viram aliases.
export function lerLegado(): Pick<Catalogo, 'dataReferencia' | 'pecas'> {
  const meta = ler('meta') as { dataReferencia: unknown }
  const resultado = validarCatalogo({
    dataReferencia: meta.dataReferencia,
    pecas: ARQUIVOS_DADOS.flatMap((arquivo) => ler(arquivo) as unknown[]),
  })
  if (!resultado.ok) {
    const detalhes = resultado.erros.map((e) => `${e.caminho}: ${e.mensagem}`).join('\n')
    throw new Error(`Catálogo legado inválido:\n${detalhes}`)
  }
  return resultado.catalogo
}
