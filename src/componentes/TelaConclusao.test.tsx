// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Desafio } from '../desafios'
import { montar, peca } from '../motor/teste-pecas'
import { TelaConclusao } from './TelaConclusao'

const desafio: Desafio = {
  id: 'primeiro-pc',
  titulo: 'Primeiro PC',
  descricao: 'Monte um PC.',
  orcamentoMaximo: 3000,
  categoriasExigidas: [],
}

// Médio 2.150; Ryzen 5 7600 com vídeo integrado e sem RAM.
const build = montar(
  peca('placa-mae-b650m-aorus-elite', 'placa-mae'),
  peca('cpu-ryzen-5-7600', 'cpu'),
)

function renderizar() {
  const onVerDesafios = vi.fn()
  const onFechar = vi.fn()
  render(
    <TelaConclusao
      desafio={desafio}
      build={build}
      onVerDesafios={onVerDesafios}
      onFechar={onFechar}
    />,
  )
  return { onVerDesafios, onFechar }
}

describe('TelaConclusao', () => {
  it('é um diálogo com Desafio concluído, o título e o resumo, e recebe o foco', () => {
    renderizar()
    const dialogo = screen.getByRole('dialog', { name: 'Desafio concluído' })
    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    expect(dialogo).toHaveFocus()
    const d = within(dialogo)
    expect(d.getByText('Primeiro PC')).toBeInTheDocument()
    expect(d.getByText(/R\$\s2\.150,00/)).toBeInTheDocument()
    expect(d.getByText('Jogos')).toBeInTheDocument()
    expect(d.getByText('Produtividade')).toBeInTheDocument()
  })

  it('os botões chamam os callbacks', async () => {
    const { onVerDesafios, onFechar } = renderizar()
    await userEvent.click(screen.getByRole('button', { name: 'Ver Desafios' }))
    expect(onVerDesafios).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole('button', { name: 'Continuar montando' }))
    expect(onFechar).toHaveBeenCalledOnce()
  })

  it('Esc fecha', async () => {
    const { onFechar } = renderizar()
    await userEvent.keyboard('{Escape}')
    expect(onFechar).toHaveBeenCalledOnce()
  })
})
