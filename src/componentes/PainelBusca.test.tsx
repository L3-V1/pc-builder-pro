// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { carregarCatalogo } from '../catalogo'
import { FILTROS_INICIAIS } from '../busca'
import { PainelBusca } from './PainelBusca'

const { pecas } = carregarCatalogo()

function montar() {
  const onMudarFiltros = vi.fn()
  render(<PainelBusca filtros={FILTROS_INICIAIS} pecas={pecas} onMudarFiltros={onMudarFiltros} />)
  return onMudarFiltros
}

describe('PainelBusca', () => {
  it('repassa mudança de texto', async () => {
    const onMudar = montar()
    await userEvent.type(screen.getByLabelText('Buscar'), 'r')
    expect(onMudar).toHaveBeenLastCalledWith({ ...FILTROS_INICIAIS, texto: 'r' })
  })

  it('repassa mudança de Categoria e limpa marcas', async () => {
    const onMudar = montar()
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'gpu')
    expect(onMudar).toHaveBeenLastCalledWith({ ...FILTROS_INICIAIS, categoria: 'gpu', marcas: [] })
  })

  it('repassa marca marcada', async () => {
    const onMudar = montar()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Corsair' }))
    expect(onMudar).toHaveBeenLastCalledWith({ ...FILTROS_INICIAIS, marcas: ['Corsair'] })
  })

  it('repassa faixa de preço', async () => {
    const onMudar = montar()
    await userEvent.type(screen.getByLabelText('Preço mínimo (R$)'), '5')
    expect(onMudar).toHaveBeenLastCalledWith({ ...FILTROS_INICIAIS, precoMin: 5 })
    await userEvent.type(screen.getByLabelText('Preço máximo (R$)'), '9')
    expect(onMudar).toHaveBeenLastCalledWith({ ...FILTROS_INICIAIS, precoMax: 9 })
  })

  it('repassa ordenação e "só compatíveis"', async () => {
    const onMudar = montar()
    await userEvent.selectOptions(screen.getByLabelText('Ordenar por'), 'preco-asc')
    expect(onMudar).toHaveBeenLastCalledWith({ ...FILTROS_INICIAIS, ordenacao: 'preco-asc' })
    await userEvent.click(screen.getByRole('checkbox', { name: 'Só compatíveis' }))
    expect(onMudar).toHaveBeenLastCalledWith({ ...FILTROS_INICIAIS, soCompativeis: true })
  })
})
