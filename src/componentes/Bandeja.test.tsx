// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ItemBandeja } from '../estado/build'
import { peca } from '../motor/teste-pecas'
import { Bandeja } from './Bandeja'

const ram = peca('ram-corsair-32gb-ddr5-6000', 'ram')
const cpu = peca('cpu-ryzen-5-7600', 'cpu')
const itens: ItemBandeja[] = [
  { chave: 'b1', peca: ram },
  { chave: 'b2', peca: ram },
  { chave: 'b3', peca: cpu },
]

describe('Bandeja', () => {
  it('vazia mostra o estado vazio', () => {
    render(<Bandeja itens={[]} onDescartar={() => {}} />)
    expect(screen.getByRole('region', { name: 'Bandeja' })).toHaveTextContent(
      'A Bandeja está vazia',
    )
  })

  it('com itens lista os nomes e o subtotal fora do Orçamento', () => {
    render(<Bandeja itens={itens} onDescartar={() => {}} />)
    expect(screen.getAllByText(ram.nome)).toHaveLength(2)
    expect(screen.getByText(cpu.nome)).toBeInTheDocument()
    expect(screen.getByTestId('bandeja-subtotal')).toHaveTextContent(/R\$\s8\.300,00/)
    expect(screen.getByText(/fora do Orçamento/)).toBeInTheDocument()
  })

  it('Descartar chama onDescartar com a chave do item', async () => {
    const onDescartar = vi.fn()
    render(<Bandeja itens={itens} onDescartar={onDescartar} />)
    await userEvent.click(screen.getAllByRole('button', { name: `Descartar ${ram.nome}` })[1])
    expect(onDescartar).toHaveBeenCalledWith('b2')
  })
})
