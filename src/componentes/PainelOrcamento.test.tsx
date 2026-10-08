// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { criarBuild } from '../motor'
import { montar, peca } from '../motor/teste-pecas'
import { PainelOrcamento } from './PainelOrcamento'

describe('PainelOrcamento', () => {
  it('mostra R$ 0,00 sem Peças e a Data de referência', () => {
    render(<PainelOrcamento build={criarBuild()} dataReferencia="2026-10" />)
    expect(screen.getByTestId('orcamento-medio')).toHaveTextContent(/R\$\s0,00/)
    expect(screen.getByText('Preços de referência: outubro de 2026')).toBeInTheDocument()
  })

  it('com Peças mostra total médio e faixa mín–máx', () => {
    const build = montar(
      peca('placa-mae-b650m-aorus-elite', 'placa-mae'),
      peca('cpu-ryzen-5-7600', 'cpu'),
    )
    render(<PainelOrcamento build={build} dataReferencia="2026-10" />)
    expect(screen.getByTestId('orcamento-medio')).toHaveTextContent(/R\$\s2\.150,00/)
    expect(screen.getByTestId('orcamento-faixa')).toHaveTextContent(
      /R\$\s1\.935,00\s*–\s*R\$\s2\.408,00/,
    )
  })
})
