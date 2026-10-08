// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { PainelInferior } from './PainelInferior'

function Controlado() {
  const [aberto, setAberto] = useState(false)
  return (
    <PainelInferior compacto aberto={aberto} rotulo="Buscar Peças" onMudarAberto={setAberto}>
      <input aria-label="Buscar" />
    </PainelInferior>
  )
}

describe('PainelInferior', () => {
  it('em tela grande renderiza os filhos sem barra', () => {
    render(
      <PainelInferior
        compacto={false}
        aberto={false}
        rotulo="Buscar Peças"
        onMudarAberto={() => {}}
      >
        <p>conteúdo</p>
      </PainelInferior>,
    )
    expect(screen.getByText('conteúdo')).toBeVisible()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('em tela pequena começa recolhido; tocar expande; Esc recolhe e devolve o foco à barra', async () => {
    render(<Controlado />)
    const barra = screen.getByRole('button', { name: 'Buscar Peças' })
    expect(barra).toHaveAttribute('aria-expanded', 'false')
    const conteudo = document.getElementById(barra.getAttribute('aria-controls') ?? '')
    expect(conteudo).toContainElement(screen.getByLabelText('Buscar'))
    expect(conteudo).toHaveAttribute('inert')

    await userEvent.click(barra)
    expect(barra).toHaveAttribute('aria-expanded', 'true')
    expect(conteudo).not.toHaveAttribute('inert')

    await userEvent.click(screen.getByLabelText('Buscar'))
    await userEvent.keyboard('{Escape}')
    expect(barra).toHaveAttribute('aria-expanded', 'false')
    expect(barra).toHaveFocus()
  })
})
