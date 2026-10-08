import { ROTULOS_CATEGORIA, ROTULOS_PERFIL } from '../busca/specs'
import type { Categoria, Perfil } from '../catalogo'
import { PERFIS } from '../catalogo/schema'
import type { Desafio } from '../desafios/schema'
import { formatarReais } from '../componentes/formatar'
import type { Build } from './build'
import { calcularChecklist, presente } from './checklist'
import { calcularOrcamento } from './orcamento'
import { calcularPontuacao } from './pontuacao'
import type { PontuacaoPerfil } from './pontuacao'

export type CriterioDesafio = {
  id: 'checklist' | 'orcamento' | `pontuacao-${Perfil}` | `categoria-${Categoria}`
  texto: string
  cumprido: boolean
}

function criterioDePontuacao(
  perfil: Perfil,
  minimo: number,
  pontuacao: PontuacaoPerfil,
): CriterioDesafio {
  const id = `pontuacao-${perfil}` as const
  const rotulo = ROTULOS_PERFIL[perfil]
  if (pontuacao.tipo === 'pendente') {
    return { id, texto: `${rotulo}: pendente, mínimo ${minimo}`, cumprido: false }
  }
  return {
    id,
    texto: `${rotulo}: ${pontuacao.valor} de ${minimo}`,
    cumprido: pontuacao.valor >= minimo,
  }
}

export function avaliarDesafio(
  desafio: Desafio,
  build: Build,
): { criterios: CriterioDesafio[]; cumprido: boolean } {
  const criterios: CriterioDesafio[] = [
    { id: 'checklist', texto: 'Checklist completa', cumprido: calcularChecklist(build).completa },
    {
      id: 'orcamento',
      texto: `Orçamento até ${formatarReais(desafio.orcamentoMaximo)}`,
      cumprido: calcularOrcamento(build).medio <= desafio.orcamentoMaximo,
    },
  ]
  const pontuacao = calcularPontuacao(build)
  for (const perfil of PERFIS) {
    const minimo = desafio.pontuacaoMinima?.[perfil]
    if (minimo !== undefined) criterios.push(criterioDePontuacao(perfil, minimo, pontuacao[perfil]))
  }
  for (const categoria of desafio.categoriasExigidas) {
    criterios.push({
      id: `categoria-${categoria}`,
      texto: `Tem ${ROTULOS_CATEGORIA[categoria]}`,
      cumprido: presente(categoria, build),
    })
  }
  return { criterios, cumprido: criterios.every((c) => c.cumprido) }
}
