import type { Catalogo } from '../catalogo'
import { ESTADO_INICIAL, reduzirBuild } from '../estado/build'
import type { AcaoBuild, EstadoBuild } from '../estado/build'
import type { EstadoSalvo } from './armazenamento'
import { decodificarLink } from './link'
import { remontarBuild, resolverIds } from './remontar'

function textoSumidas(n: number): string {
  return n === 1
    ? '1 Peça salva não existe mais no Catálogo.'
    : `${n} Peças salvas não existem mais no Catálogo.`
}

function restaurar(salvo: EstadoSalvo, catalogo: Catalogo): EstadoBuild {
  const daBuild = resolverIds(salvo.build, catalogo.pecas)
  const daBandeja = resolverIds(salvo.bandeja, catalogo.pecas)
  const { build, recusadas } = remontarBuild(daBuild.pecas)
  const restaurado = [...daBandeja.pecas, ...recusadas].reduce<EstadoBuild>(
    (estado, peca) => reduzirBuild(estado, { tipo: 'guardar', peca }),
    { ...ESTADO_INICIAL, build, meta: salvo.meta },
  )
  const sumidas = daBuild.desconhecidos.length + daBandeja.desconhecidos.length
  if (sumidas === 0) return restaurado
  return reduzirBuild(restaurado, { tipo: 'avisar', texto: textoSumidas(sumidas), tom: 'info' })
}

// Tokens malformados contam como Peças do link que não existem mais.
export function acaoDoLink(hash: string, catalogo: Catalogo): AcaoBuild | undefined {
  const link = decodificarLink(hash)
  if (!link) return undefined
  const { pecas, desconhecidos } = resolverIds(link.ids, catalogo.pecas)
  return {
    tipo: 'substituir',
    pecas,
    meta: link.meta,
    desconhecidos: desconhecidos.length + link.invalidos,
  }
}

export function iniciarEstado({
  salvo,
  hash,
  catalogo,
}: {
  salvo?: EstadoSalvo
  hash: string
  catalogo: Catalogo
}): EstadoBuild {
  const estado = salvo ? restaurar(salvo, catalogo) : ESTADO_INICIAL
  const acao = acaoDoLink(hash, catalogo)
  return acao ? reduzirBuild(estado, acao) : estado
}
