// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Desafio } from '../desafios'
import type { CriterioDesafio } from '../motor'
import { PainelDesafio } from './PainelDesafio'

const desafio: Desafio = {
  id: 'gamer',
  titulo: 'Gamer de entrada',
  descricao: 'Jogos leves.',
  orcamentoMaximo: 4000,
  categoriasExigidas: ['gpu'],
}

const criterios: CriterioDesafio[] = [
  { id: 'checklist', texto: 'Checklist completa', cumprido: true },
  { id: 'orcamento', texto: 'Orçamento até R$ 4.000,00', cumprido: true },
  { id: 'categoria-gpu', texto: 'Tem GPU', cumprido: false },
]

function renderizar(cumprido: boolean) {
  const onLigar = vi.fn()
  const onVoltar = vi.fn()
  const lista = cumprido ? criterios.map((c) => ({ ...c, cumprido: true })) : criterios
  render(
    <PainelDesafio
      desafio={desafio}
      avaliacao={{ criterios: lista, cumprido }}
      onLigar={onLigar}
      onVoltar={onVoltar}
    />,
  )
  return { onLigar, onVoltar }
}

describe('PainelDesafio', () => {
  it('mostra o título, cada critério com o estado em texto e o contador', () => {
    renderizar(false)
    const painel = within(screen.getByRole('region', { name: 'Desafio: Gamer de entrada' }))
    const itens = painel.getAllByRole('listitem').map((li) => li.textContent)
    expect(itens).toEqual([
      'Cumprido: Checklist completa',
      'Cumprido: Orçamento até R$ 4.000,00',
      'Pendente: Tem GPU',
    ])
    expect(painel.getByText('2 de 3 critérios')).toBeInTheDocument()
  })

  it('Ligar o PC fica desabilitado com explicação enquanto falta critério', async () => {
    const { onLigar } = renderizar(false)
    const botao = screen.getByRole('button', { name: 'Ligar o PC' })
    expect(botao).toBeDisabled()
    expect(botao).toHaveAccessibleDescription('Cumpra todos os critérios para ligar o PC.')
    await userEvent.click(botao)
    expect(onLigar).not.toHaveBeenCalled()
  })

  it('com tudo cumprido Ligar o PC chama onLigar, e Voltar chama onVoltar', async () => {
    const { onLigar, onVoltar } = renderizar(true)
    expect(screen.getByText('3 de 3 critérios')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ligar o PC' }))
    expect(onLigar).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole('button', { name: 'Voltar aos Desafios' }))
    expect(onVoltar).toHaveBeenCalledOnce()
  })
})
