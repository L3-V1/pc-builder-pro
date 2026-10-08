// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Desafio } from '../desafios'
import { TelaDesafios } from './TelaDesafios'

const base = { descricao: 'Descrição.', categoriasExigidas: [] }
const desafios: Desafio[] = [
  { ...base, id: 'primeiro', titulo: 'Primeiro PC', orcamentoMaximo: 3000 },
  {
    ...base,
    id: 'gamer',
    titulo: 'Gamer',
    orcamentoMaximo: 4000,
    pontuacaoMinima: { jogos: 40, produtividade: 20 },
    categoriasExigidas: ['gpu'],
  },
  { ...base, id: 'novo', titulo: 'Novo', orcamentoMaximo: 5000 },
]

const card = (titulo: string) => within(screen.getByRole('article', { name: titulo }))

function renderizar(onAbrir = vi.fn()) {
  render(
    <TelaDesafios
      desafios={desafios}
      concluidos={['primeiro']}
      emAndamento={['primeiro', 'gamer']}
      onAbrir={onAbrir}
    />,
  )
  return onAbrir
}

describe('TelaDesafios', () => {
  it('lista os Desafios com título, descrição e resumo dos critérios', () => {
    renderizar()
    expect(screen.getAllByRole('article')).toHaveLength(3)
    const gamer = card('Gamer')
    expect(gamer.getByText('Descrição.')).toBeInTheDocument()
    const resumo = gamer.getByRole('list', { name: 'Critérios' })
    expect(
      within(resumo)
        .getAllByRole('listitem')
        .map((li) => li.textContent?.replace(/\s/g, ' ')),
    ).toEqual(['Até R$ 4.000', 'Jogos ≥ 40', 'Produtividade ≥ 20', 'Exige GPU'])
  })

  it('mostra o selo Concluído, Continuar em quem tem progresso e Iniciar nos outros', () => {
    renderizar()
    expect(card('Primeiro PC').getByText('Concluído')).toBeInTheDocument()
    expect(card('Gamer').queryByText('Concluído')).not.toBeInTheDocument()
    expect(card('Primeiro PC').getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
    expect(card('Gamer').getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
    expect(card('Novo').getByRole('button', { name: 'Iniciar' })).toBeInTheDocument()
  })

  it('o botão chama onAbrir com o Desafio', async () => {
    const onAbrir = renderizar()
    await userEvent.click(card('Novo').getByRole('button', { name: 'Iniciar' }))
    expect(onAbrir).toHaveBeenCalledWith(desafios[2])
  })
})
