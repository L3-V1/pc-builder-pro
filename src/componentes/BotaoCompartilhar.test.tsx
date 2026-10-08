// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { criarBuild } from '../motor'
import { montar, peca } from '../motor/teste-pecas'
import { BotaoCompartilhar } from './BotaoCompartilhar'

const placa = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const ram = peca('ram-corsair-32gb-ddr5-6000', 'ram')
const build = montar(placa, ram, ram)

// userEvent.setup() instala um clipboard próprio; o mock vem depois para sobrescrevê-lo.
function mockClipboard(writeText: (texto: string) => Promise<void>) {
  const usuario = userEvent.setup()
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  return usuario
}

describe('BotaoCompartilhar', () => {
  it('fica desabilitado com Build vazia e sem Meta, e habilitado só com Meta', () => {
    const { rerender } = render(<BotaoCompartilhar build={criarBuild()} onCopiado={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Copiar link' })).toBeDisabled()
    rerender(<BotaoCompartilhar build={criarBuild()} meta={3000} onCopiado={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Copiar link' })).toBeEnabled()
  })

  it('o clique copia o link da Build e da Meta e chama onCopiado', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const usuario = mockClipboard(writeText)
    const onCopiado = vi.fn()
    render(<BotaoCompartilhar build={build} meta={5000} onCopiado={onCopiado} />)
    await usuario.click(screen.getByRole('button', { name: 'Copiar link' }))
    expect(writeText).toHaveBeenCalledWith(
      `${location.origin}${location.pathname}#b=${placa.id},${ram.id}*2&m=5000`,
    )
    expect(onCopiado).toHaveBeenCalledOnce()
  })

  it('quando o clipboard falha mostra o link num campo somente leitura, já selecionado', async () => {
    const usuario = mockClipboard(vi.fn().mockRejectedValue(new Error('negado')))
    const onCopiado = vi.fn()
    render(<BotaoCompartilhar build={build} onCopiado={onCopiado} />)
    await usuario.click(screen.getByRole('button', { name: 'Copiar link' }))
    const campo = await screen.findByRole('textbox', { name: 'Copie o link abaixo' })
    expect(campo).toHaveAttribute('readonly')
    expect(campo).toHaveValue(`${location.origin}${location.pathname}#b=${placa.id},${ram.id}*2`)
    expect(campo).toHaveFocus()
    expect(onCopiado).not.toHaveBeenCalled()
  })
})
