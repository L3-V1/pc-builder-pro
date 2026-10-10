// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { buscarFixture } from './teste/catalogo'

// Segura todos os fetch até `liberar()`; cada pedido é respondido pela fixture.
function buscarPendente() {
  let liberar = () => {}
  const portao = new Promise<void>((resolve) => (liberar = resolve))
  const buscar = vi.fn<typeof fetch>(async (url, init) => {
    await portao
    return buscarFixture(url, init)
  })
  return { buscar, liberar }
}

const falhando = vi.fn<typeof fetch>(async () => new Response('erro', { status: 503 }))

describe('App (carregador do Catálogo)', () => {
  it('Cenário: enquanto o fetch não resolve, mostra a tela de carregamento e não a busca', () => {
    // Dado um servidor que ainda não respondeu
    const { buscar } = buscarPendente()
    // Quando o app abre
    render(<App buscar={buscar} />)
    // Então mostra "Carregando o Catálogo…" e nada da montagem
    expect(screen.getByRole('status')).toHaveTextContent('Carregando o Catálogo…')
    expect(screen.queryByLabelText('Buscar')).not.toBeInTheDocument()
  })

  it('Cenário: quando o Catálogo chega, mostra a montagem com a busca e a Data de referência', async () => {
    const { buscar, liberar } = buscarPendente()
    render(<App buscar={buscar} />)
    liberar()
    expect(await screen.findByLabelText('Buscar')).toBeInTheDocument()
    expect(screen.queryByText('Carregando o Catálogo…')).not.toBeInTheDocument()
    expect(screen.getByText('Preços de referência: outubro de 2026')).toBeInTheDocument()
  })

  it('Cenário: quando o fetch falha, mostra a tela de erro com "Tentar de novo"', async () => {
    render(<App buscar={falhando} />)
    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Não foi possível carregar o Catálogo')
    expect(alerta).toHaveTextContent('erro 503')
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Buscar')).not.toBeInTheDocument()
  })

  it('Cenário: "Tentar de novo" refaz o fetch e, se der certo, mostra a montagem', async () => {
    // Dado que a primeira tentativa falhou
    let falhar = true
    const buscar = vi.fn<typeof fetch>((url, init) =>
      falhar ? Promise.reject(new TypeError('offline')) : buscarFixture(url, init),
    )
    render(<App buscar={buscar} />)
    await screen.findByRole('alert')
    const chamadas = buscar.mock.calls.length
    // Quando o servidor volta e o usuário clica "Tentar de novo"
    falhar = false
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    // Então o fetch é refeito e a montagem aparece
    expect(await screen.findByLabelText('Buscar')).toBeInTheDocument()
    expect(buscar.mock.calls.length).toBeGreaterThan(chamadas)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('Cenário: um link #... presente antes do carregamento é aplicado quando o Catálogo chega', async () => {
    // Dado um link compartilhado na URL enquanto o Catálogo carrega
    const link = '#b=placa-mae-b650m-aorus-elite,cpu-ryzen-5-7600&m=4000'
    history.replaceState(null, '', link)
    const { buscar, liberar } = buscarPendente()
    render(<App buscar={buscar} />)
    expect(location.hash).toBe(link)
    // Quando o Catálogo chega
    liberar()
    // Então a Build do link está montada, com aviso, e o link sai da URL
    const socket = await screen.findByRole('group', { name: 'Socket da CPU' })
    expect(within(socket).getByText('Ryzen 5 7600')).toBeInTheDocument()
    expect(screen.getByLabelText('Meta de orçamento (R$)')).toHaveValue('4.000')
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent(
      'Build do link carregada.',
    )
    await waitFor(() => expect(location.hash).toBe(''))
  })

  it('Cenário: desmontar durante o carregamento aborta o fetch sem setState', async () => {
    const erros = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { buscar, liberar } = buscarPendente()
    const { unmount } = render(<App buscar={buscar} />)
    unmount()
    const signal = buscar.mock.calls[0][1]?.signal
    expect(signal?.aborted).toBe(true)
    liberar()
    await new Promise((r) => setTimeout(r, 20))
    expect(erros).not.toHaveBeenCalled()
    erros.mockRestore()
  })
})
