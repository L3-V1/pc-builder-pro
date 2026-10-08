import type { Desafio } from '../desafios'
import { ESTADO_INICIAL, reduzirBuild } from './build'
import type { AcaoBuild, EstadoBuild } from './build'

export type Tela = 'livre' | 'desafios' | 'desafio'

export type EstadoApp = {
  tela: Tela
  livre: EstadoBuild
  desafioAtivo?: string
  progresso: Record<string, EstadoBuild>
  concluidos: string[]
}

export type AcaoApp =
  | AcaoBuild
  | { tipo: 'ir-para'; tela: 'livre' | 'desafios' }
  | { tipo: 'abrir-desafio'; desafio: Desafio }
  | { tipo: 'concluir-desafio'; id: string }

export const ESTADO_APP_INICIAL: EstadoApp = {
  tela: 'livre',
  livre: ESTADO_INICIAL,
  progresso: {},
  concluidos: [],
}

export function reduzirApp(estado: EstadoApp, acao: AcaoApp): EstadoApp {
  switch (acao.tipo) {
    case 'abrir-desafio': {
      const { id, orcamentoMaximo } = acao.desafio
      const progresso = estado.progresso[id] ?? { ...ESTADO_INICIAL, meta: orcamentoMaximo }
      return {
        ...estado,
        tela: 'desafio',
        desafioAtivo: id,
        progresso: { ...estado.progresso, [id]: progresso },
      }
    }
    case 'definir-meta':
      // A Meta do Desafio é travada no orçamento máximo dele.
      return desafioNaTela(estado) === undefined ? encaminhar(estado, acao) : estado
    case 'substituir':
      // O link é sempre da Build livre.
      return { ...estado, tela: 'livre', livre: reduzirBuild(estado.livre, acao) }
    case 'concluir-desafio':
      if (estado.concluidos.includes(acao.id)) return estado
      return { ...estado, concluidos: [...estado.concluidos, acao.id] }
    case 'ir-para':
      return { ...estado, tela: acao.tela }
    default:
      return encaminhar(estado, acao)
  }
}

function encaminhar(estado: EstadoApp, acao: AcaoBuild): EstadoApp {
  return comAtivo(estado, reduzirBuild(estadoAtivo(estado), acao))
}

// ID do Desafio cuja Build está na tela, ou undefined na Montagem livre.
function desafioNaTela(estado: EstadoApp): string | undefined {
  return estado.tela === 'desafio' ? estado.desafioAtivo : undefined
}

function comAtivo(estado: EstadoApp, ativo: EstadoBuild): EstadoApp {
  const id = desafioNaTela(estado)
  if (id === undefined) return { ...estado, livre: ativo }
  return { ...estado, progresso: { ...estado.progresso, [id]: ativo } }
}

export function estadoAtivo(estado: EstadoApp): EstadoBuild {
  const id = desafioNaTela(estado)
  return (id !== undefined && estado.progresso[id]) || estado.livre
}
