import armazenamento from './dados/armazenamento.json'
import cooler from './dados/cooler.json'
import cpu from './dados/cpu.json'
import fonte from './dados/fonte.json'
import gabinete from './dados/gabinete.json'
import gpu from './dados/gpu.json'
import meta from './dados/meta.json'
import placaMae from './dados/placa-mae.json'
import ram from './dados/ram.json'
import type { Catalogo } from './schema'
import { validarCatalogo } from './validar'

export type { Categoria, Catalogo, FaixaPreco, Indices, Peca, PecaDe, Perfil } from './schema'

let memoizado: Catalogo | undefined

export function carregarCatalogo(): Catalogo {
  if (memoizado) return memoizado
  const resultado = validarCatalogo({
    dataReferencia: meta.dataReferencia,
    pecas: [
      ...cpu,
      ...placaMae,
      ...ram,
      ...gpu,
      ...armazenamento,
      ...fonte,
      ...gabinete,
      ...cooler,
    ],
  })
  if (!resultado.ok) {
    const detalhes = resultado.erros.map((e) => `${e.caminho}: ${e.mensagem}`).join('\n')
    throw new Error(`Catálogo inválido:\n${detalhes}`)
  }
  memoizado = resultado.catalogo
  return memoizado
}
