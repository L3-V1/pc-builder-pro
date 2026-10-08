import type { Peca } from '../catalogo'
import { avaliarPeca } from '../busca'
import { precisaDePlaca } from '../bancada/slots'
import { criarBuild, encaixar, pecasDaBuild, remover } from '../motor'
import type { Build } from '../motor'
import { remontarBuild } from '../persistencia/remontar'

export type ItemBandeja = { chave: string; peca: Peca }

export type EstadoBuild = {
  build: Build
  bandeja: ItemBandeja[]
  proximaChave: number
  meta?: number
  aviso?: { id: number; texto: string; tom: 'info' | 'erro' }
}

export type AcaoBuild =
  | { tipo: 'encaixar'; peca: Peca; daBandeja?: string }
  | { tipo: 'guardar'; peca: Peca }
  | { tipo: 'desencaixar'; pecaId: string }
  | { tipo: 'descartar'; chave: string }
  | { tipo: 'definir-meta'; valor?: number }
  | { tipo: 'substituir'; pecas: Peca[]; meta?: number; desconhecidos: number }
  | { tipo: 'avisar'; texto: string; tom: 'info' | 'erro' }

export const ESTADO_INICIAL: EstadoBuild = { build: criarBuild(), bandeja: [], proximaChave: 1 }

export function reduzirBuild(estado: EstadoBuild, acao: AcaoBuild): EstadoBuild {
  switch (acao.tipo) {
    case 'encaixar':
      return encaixarPeca(estado, acao.peca, acao.daBandeja)
    case 'guardar':
      return guardar(estado, [acao.peca])
    case 'desencaixar':
      return desencaixar(estado, acao.pecaId)
    case 'descartar':
      return descartar(estado, acao.chave)
    case 'definir-meta':
      return { ...estado, meta: acao.valor }
    case 'substituir':
      return substituir(estado, acao)
    case 'avisar':
      return avisar(estado, acao.texto, acao.tom)
  }
}

function guardar(estado: EstadoBuild, pecas: Peca[]): EstadoBuild {
  if (pecas.length === 0) return estado
  const novos = pecas.map((peca, i) => ({ chave: `b${estado.proximaChave + i}`, peca }))
  return {
    ...estado,
    bandeja: [...estado.bandeja, ...novos],
    proximaChave: estado.proximaChave + pecas.length,
  }
}

function textoParaBandeja(n: number): string {
  return n === 1 ? '1 Peça foi para a Bandeja' : `${n} Peças foram para a Bandeja`
}

function avisar(estado: EstadoBuild, texto: string, tom: 'info' | 'erro'): EstadoBuild {
  return { ...estado, aviso: { id: (estado.aviso?.id ?? 0) + 1, texto, tom } }
}

function encaixarPeca(estado: EstadoBuild, peca: Peca, daBandeja?: string): EstadoBuild {
  if (precisaDePlaca(peca) && !estado.build['placa-mae']) {
    const comPeca = daBandeja ? estado : guardar(estado, [peca])
    return avisar(comPeca, 'Encaixe uma placa-mãe primeiro', 'info')
  }
  if (avaliarPeca(estado.build, peca).tipo === 'na-build') return estado
  const resultado = encaixar(estado.build, peca)
  if (!resultado.ok) {
    return avisar(estado, resultado.bloqueios.map((b) => b.mensagem).join(' '), 'erro')
  }
  const base = daBandeja ? descartar(estado, daBandeja) : estado
  const { removidas } = resultado
  const novo = guardar({ ...base, build: resultado.build }, removidas)
  const encaixada = `${peca.nome} encaixada na Build`
  if (removidas.length === 0) return avisar(novo, encaixada, 'info')
  return avisar(novo, `${encaixada}. ${textoParaBandeja(removidas.length)}.`, 'info')
}

function descartar(estado: EstadoBuild, chave: string): EstadoBuild {
  return { ...estado, bandeja: estado.bandeja.filter((i) => i.chave !== chave) }
}

function desencaixar(estado: EstadoBuild, pecaId: string): EstadoBuild {
  const pecas = pecasDaBuild(estado.build)
  const peca = pecas.find((p) => p.id === pecaId)
  if (!peca) return estado
  const saem = peca.categoria === 'placa-mae' ? [peca, ...pecas.filter(precisaDePlaca)] : [peca]
  const build = saem.reduce((b, p) => remover(b, p.id), estado.build)
  return guardar({ ...estado, build }, saem)
}

function mesmasPecas(a: Build, b: Build): boolean {
  const chave = (build: Build) =>
    pecasDaBuild(build)
      .map((p) => p.id)
      .sort()
      .join(',')
  return chave(a) === chave(b)
}

function substituir(
  estado: EstadoBuild,
  { pecas, meta = estado.meta, desconhecidos }: Extract<AcaoBuild, { tipo: 'substituir' }>,
): EstadoBuild {
  const { build, recusadas } = remontarBuild(pecas)
  const anteriores = mesmasPecas(estado.build, build) ? [] : pecasDaBuild(estado.build)
  const base = guardar({ ...estado, build, meta }, [...anteriores, ...recusadas])
  const texto = ['Build do link carregada.']
  if (anteriores.length > 0) texto.push('A Build anterior foi para a Bandeja.')
  if (desconhecidos === 1) texto.push('1 Peça do link não existe mais no Catálogo.')
  if (desconhecidos > 1) texto.push(`${desconhecidos} Peças do link não existem mais no Catálogo.`)
  if (recusadas.length > 0) texto.push(`${textoParaBandeja(recusadas.length)}.`)
  return avisar(base, texto.join(' '), 'info')
}

export function subtotalBandeja(bandeja: ItemBandeja[]): number {
  return bandeja.reduce((soma, { peca }) => soma + peca.faixaPreco.medio, 0)
}
