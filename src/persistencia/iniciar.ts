import type { Catalogo } from '../catalogo'
import type { Desafio } from '../desafios'
import { ESTADO_APP_INICIAL, reduzirApp } from '../estado/app'
import type { EstadoApp } from '../estado/app'
import { ESTADO_INICIAL, reduzirBuild } from '../estado/build'
import type { AcaoBuild, EstadoBuild } from '../estado/build'
import type { EstadoSalvo } from './armazenamento'
import type { DesafiosSalvos } from './desafios'
import { decodificarLink } from './link'
import { remontarBuild, resolverIds } from './remontar'

function textoSumidas(n: number): string {
  return n === 1
    ? '1 Peça salva não existe mais no Catálogo.'
    : `${n} Peças salvas não existem mais no Catálogo.`
}

export function restaurarEstado(salvo: EstadoSalvo, catalogo: Catalogo): EstadoBuild {
  const daBuild = resolverIds(salvo.build, catalogo.pecas, catalogo.aliases)
  const daBandeja = resolverIds(salvo.bandeja, catalogo.pecas, catalogo.aliases)
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
  const { pecas, desconhecidos } = resolverIds(link.ids, catalogo.pecas, catalogo.aliases)
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
  const estado = salvo ? restaurarEstado(salvo, catalogo) : ESTADO_INICIAL
  const acao = acaoDoLink(hash, catalogo)
  return acao ? reduzirBuild(estado, acao) : estado
}

function restaurarDesafios(
  salvos: DesafiosSalvos,
  catalogo: Catalogo,
  desafios: Desafio[],
): Omit<EstadoApp, 'livre'> {
  const porId = new Map(desafios.map((d) => [d.id, d]))
  const progresso: Record<string, EstadoBuild> = {}
  for (const [id, { build, bandeja }] of Object.entries(salvos.progresso)) {
    const desafio = porId.get(id)
    if (!desafio) continue
    const salvo = { versao: 1 as const, build, bandeja, meta: desafio.orcamentoMaximo }
    progresso[id] = restaurarEstado(salvo, catalogo)
  }
  const ativoExiste = salvos.desafioAtivo !== undefined && porId.has(salvos.desafioAtivo)
  return {
    tela: salvos.tela === 'desafio' && !ativoExiste ? 'desafios' : salvos.tela,
    ...(ativoExiste ? { desafioAtivo: salvos.desafioAtivo } : {}),
    progresso,
    concluidos: salvos.concluidos.filter((id) => porId.has(id)),
  }
}

export function iniciarApp({
  salvo,
  desafiosSalvos,
  hash,
  catalogo,
  desafios,
}: {
  salvo?: EstadoSalvo
  desafiosSalvos?: DesafiosSalvos
  hash: string
  catalogo: Catalogo
  desafios: Desafio[]
}): EstadoApp {
  const base = desafiosSalvos
    ? restaurarDesafios(desafiosSalvos, catalogo, desafios)
    : ESTADO_APP_INICIAL
  const app = { ...base, livre: salvo ? restaurarEstado(salvo, catalogo) : ESTADO_INICIAL }
  const acao = acaoDoLink(hash, catalogo)
  return acao ? reduzirApp(app, acao) : app
}
