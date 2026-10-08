// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { criarBuild } from '../motor'
import { montar, peca } from '../motor/teste-pecas'
import { Bancada } from './Bancada'

const placaAm5 = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const cpu = peca('cpu-ryzen-5-7600', 'cpu')

describe('Bancada', () => {
  it('vazia mostra os Slots de gabinete, fonte e placa-mãe, sem socket e sem DIMM', () => {
    render(<Bancada build={criarBuild()} onDesencaixar={() => {}} />)
    for (const rotulo of ['Gabinete', 'Fonte', 'Placa-mãe']) {
      expect(screen.getByRole('group', { name: rotulo })).toBeInTheDocument()
    }
    expect(screen.queryByRole('group', { name: 'Socket da CPU' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /Slot DIMM/ })).not.toBeInTheDocument()
  })

  it('com placa mostra os DIMMs rotulados e a Peça encaixada no Slot', () => {
    render(<Bancada build={montar(placaAm5, cpu)} onDesencaixar={() => {}} />)
    for (const n of [1, 2, 3, 4]) {
      expect(screen.getByRole('group', { name: `Slot DIMM ${n}` })).toBeInTheDocument()
    }
    const socket = screen.getByRole('group', { name: 'Socket da CPU' })
    expect(within(socket).getByText(cpu.nome)).toBeInTheDocument()
  })

  it('o botão Remover no Slot chama onDesencaixar com o ID da Peça', async () => {
    const onDesencaixar = vi.fn()
    render(<Bancada build={montar(placaAm5, cpu)} onDesencaixar={onDesencaixar} />)
    await userEvent.click(screen.getByRole('button', { name: `Remover ${cpu.nome}` }))
    expect(onDesencaixar).toHaveBeenCalledWith(cpu.id)
  })
})
