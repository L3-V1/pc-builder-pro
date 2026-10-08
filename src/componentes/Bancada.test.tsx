// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react'
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

  it('Slot vazio e o Slot SATA mostram "Escolher"; Slot ocupado de uma Peça só não mostra', () => {
    render(<Bancada build={montar(placaAm5, cpu)} onDesencaixar={() => {}} onEscolher={() => {}} />)
    const escolher = (rotulo: string) =>
      within(screen.getByRole('group', { name: rotulo })).queryByRole('button', {
        name: `Escolher Peça para ${rotulo}`,
      })
    expect(escolher('Slot DIMM 1')).toBeInTheDocument()
    expect(escolher('Discos SATA')).toBeInTheDocument()
    expect(escolher('Socket da CPU')).not.toBeInTheDocument()
    expect(escolher('Placa-mãe')).not.toBeInTheDocument()
  })

  it('clicar em "Escolher" chama onEscolher com o Slot; durante um arraste fica desabilitado', async () => {
    const onEscolher = vi.fn()
    const build = montar(placaAm5)
    const { rerender } = render(
      <Bancada build={build} onDesencaixar={() => {}} onEscolher={onEscolher} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Escolher Peça para Socket da CPU' }))
    expect(onEscolher).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'cpu', categoria: 'cpu' }),
    )

    const ativa = { peca: cpu, origem: { tipo: 'busca' as const } }
    rerender(
      <Bancada build={build} ativa={ativa} onDesencaixar={() => {}} onEscolher={onEscolher} />,
    )
    expect(screen.getByRole('button', { name: 'Escolher Peça para Socket da CPU' })).toBeDisabled()
  })

  it('o Slot que recusou a Peça ganha a classe da tremida e avisa quando ela termina', () => {
    const onFimRecusa = vi.fn()
    render(
      <Bancada
        build={montar(placaAm5)}
        recusado="cpu"
        onFimRecusa={onFimRecusa}
        onDesencaixar={() => {}}
      />,
    )
    const socket = screen.getByRole('group', { name: 'Socket da CPU' })
    expect(socket).toHaveClass('slot--recusado')
    expect(screen.getByRole('group', { name: 'Slot DIMM 1' })).not.toHaveClass('slot--recusado')
    // Sem AnimationEvent no jsdom, o React escuta o nome com prefixo.
    fireEvent(socket, new Event('webkitAnimationEnd', { bubbles: true }))
    expect(onFimRecusa).toHaveBeenCalled()
  })
})
