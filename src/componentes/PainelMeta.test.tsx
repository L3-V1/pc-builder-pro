// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { criarBuild } from '../motor'
import { montar, peca } from '../motor/teste-pecas'
import { PainelMeta } from './PainelMeta'

// Médio 2.150, faixa 1.935 – 2.408
const build = montar(
  peca('placa-mae-b650m-aorus-elite', 'placa-mae'),
  peca('cpu-ryzen-5-7600', 'cpu'),
)

describe('PainelMeta', () => {
  it('sem Meta mostra o campo vazio e nenhuma barra', () => {
    render(<PainelMeta build={criarBuild()} onDefinirMeta={vi.fn()} />)
    expect(screen.getByLabelText('Meta de orçamento (R$)')).toHaveValue('')
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })

  it.each([
    ['Enter', '{Enter}'],
    ['blur', '{Tab}'],
  ])('digitar 5.000 e confirmar com %s define a Meta em 5000', async (_modo, tecla) => {
    const onDefinirMeta = vi.fn()
    render(<PainelMeta build={criarBuild()} onDefinirMeta={onDefinirMeta} />)
    await userEvent.type(screen.getByLabelText('Meta de orçamento (R$)'), `5.000${tecla}`)
    expect(onDefinirMeta).toHaveBeenCalledOnce()
    expect(onDefinirMeta).toHaveBeenCalledWith(5000)
  })

  it('valor inválido mostra a mensagem em pt-BR e não altera a Meta', async () => {
    const onDefinirMeta = vi.fn()
    render(<PainelMeta build={criarBuild()} meta={3000} onDefinirMeta={onDefinirMeta} />)
    const campo = screen.getByLabelText('Meta de orçamento (R$)')
    await userEvent.clear(campo)
    await userEvent.type(campo, '10,5{Enter}')
    expect(onDefinirMeta).not.toHaveBeenCalled()
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription(
      'Informe um valor inteiro em reais, de R$ 1 a R$ 1.000.000',
    )
  })

  it('abaixo da Meta mostra quanto falta e a barra com o médio', () => {
    render(<PainelMeta build={build} meta={3000} onDefinirMeta={vi.fn()} />)
    expect(screen.getByText(/Faltam R\$\s850,00 para a Meta/)).toBeInTheDocument()
    const barra = screen.getByRole('meter', { name: 'Orçamento em relação à Meta' })
    expect(barra).toHaveAttribute('aria-valuenow', '2150')
    expect(barra).toHaveAttribute('aria-valuemax', '3000')
    expect(screen.queryByText(/No preço máximo/)).not.toBeInTheDocument()
  })

  it('acima da Meta mostra o excesso e a barra em perigo, limitada a 100%', () => {
    render(<PainelMeta build={build} meta={2000} onDefinirMeta={vi.fn()} />)
    expect(screen.getByText(/R\$\s150,00 acima da Meta/)).toBeInTheDocument()
    const barra = screen.getByRole('meter')
    expect(barra).toHaveClass('meta__barra--acima')
    expect(barra.firstElementChild).toHaveStyle({ width: '100%' })
  })

  it('exatamente na Meta avisa', () => {
    render(<PainelMeta build={build} meta={2150} onDefinirMeta={vi.fn()} />)
    expect(screen.getByText('Exatamente na Meta')).toBeInTheDocument()
  })

  it('quando o máximo passa da Meta mostra a nota do máximo', () => {
    render(<PainelMeta build={build} meta={2200} onDefinirMeta={vi.fn()} />)
    expect(screen.getByText(/No preço máximo, pode passar em até R\$\s208,00/)).toBeInTheDocument()
  })

  it('o campo começa com a Meta atual, com pontos de milhar', () => {
    render(<PainelMeta build={build} meta={12000} onDefinirMeta={vi.fn()} />)
    expect(screen.getByLabelText('Meta de orçamento (R$)')).toHaveValue('12.000')
  })
})

describe('PainelMeta travada', () => {
  it('mostra a Meta do Desafio somente leitura e não a altera', async () => {
    const onDefinirMeta = vi.fn()
    render(<PainelMeta build={build} meta={3000} travada onDefinirMeta={onDefinirMeta} />)
    const campo = screen.getByLabelText('Meta do Desafio (R$)')
    expect(campo).toHaveValue('3.000')
    expect(campo).toHaveAttribute('readonly')
    await userEvent.type(campo, '9{Enter}')
    await userEvent.tab()
    expect(campo).toHaveValue('3.000')
    expect(onDefinirMeta).not.toHaveBeenCalled()
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })
})
