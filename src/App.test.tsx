// @vitest-environment jsdom
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { CHAVE_ESTADO } from './persistencia'

async function adicionar(texto: string) {
  const buscar = screen.getByLabelText('Buscar')
  await userEvent.clear(buscar)
  await userEvent.type(buscar, texto)
  await userEvent.click(screen.getByRole('button', { name: /Adicionar à Build|Trocar/ }))
}

describe('App', () => {
  it('adicionar CPU sem placa-mãe a coloca na Bandeja com aviso e Orçamento zerado', async () => {
    render(<App />)
    await adicionar('ryzen 7600')

    const bandeja = screen.getByRole('region', { name: 'Bandeja' })
    expect(within(bandeja).getByText('Ryzen 5 7600')).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent(
      'Encaixe uma placa-mãe primeiro',
    )
    expect(screen.getByTestId('orcamento-medio')).toHaveTextContent(/R\$\s0,00/)
  })

  it('mostra estado vazio quando nada casa com a busca', async () => {
    render(<App />)
    await userEvent.type(screen.getByLabelText('Buscar'), 'xyzinexistente')
    expect(screen.getByText('Nenhuma Peça encontrada')).toBeInTheDocument()
  })

  it('placa e depois CPU por clique mostram a CPU no socket e o Orçamento atualizado', async () => {
    render(<App />)
    await adicionar('b650m aorus')
    await adicionar('ryzen 7600')

    const socket = screen.getByRole('group', { name: 'Socket da CPU' })
    expect(within(socket).getByText('Ryzen 5 7600')).toBeInTheDocument()
    expect(screen.getByTestId('orcamento-medio')).toHaveTextContent(/R\$\s2\.150,00/)
  })

  it('trocar para placa DDR4 manda CPU e RAM para a Bandeja, sem diálogo', async () => {
    render(<App />)
    await adicionar('b650m aorus')
    await adicionar('ryzen 7600')
    await adicionar('vengeance 2x16')
    await adicionar('b760m')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const bandeja = screen.getByRole('region', { name: 'Bandeja' })
    expect(within(bandeja).getByText('Ryzen 5 7600')).toBeInTheDocument()
    expect(within(bandeja).getByText('Vengeance 2x16 GB')).toBeInTheDocument()
    expect(
      within(screen.getByRole('group', { name: 'Placa-mãe' })).getByText(/B760M DS3H/),
    ).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent(
      '3 Peças foram para a Bandeja',
    )
  })
})

describe('App: persistência', () => {
  it('depois de adicionar placa e CPU o localStorage tem os IDs', async () => {
    render(<App />)
    await adicionar('b650m aorus')
    await adicionar('ryzen 7600')
    expect(JSON.parse(localStorage.getItem(CHAVE_ESTADO) ?? 'null')).toEqual({
      versao: 1,
      build: ['cpu-ryzen-5-7600', 'placa-mae-b650m-aorus-elite'],
      bandeja: [],
    })
  })

  it('com um estado salvo no localStorage mostra a Build, a Bandeja e a Meta restauradas', () => {
    localStorage.setItem(
      CHAVE_ESTADO,
      JSON.stringify({
        versao: 1,
        build: ['placa-mae-b650m-aorus-elite', 'cpu-ryzen-5-7600'],
        bandeja: ['gpu-rtx-4060'],
        meta: 5000,
      }),
    )
    render(<App />)
    const socket = screen.getByRole('group', { name: 'Socket da CPU' })
    expect(within(socket).getByText('Ryzen 5 7600')).toBeInTheDocument()
    expect(screen.getByTestId('orcamento-medio')).toHaveTextContent(/R\$\s2\.150,00/)
    const bandeja = screen.getByRole('region', { name: 'Bandeja' })
    expect(within(bandeja).getByText('GeForce RTX 4060')).toBeInTheDocument()
    expect(screen.getByLabelText('Meta de orçamento (R$)')).toHaveValue('5.000')
  })

  it('com #b=...&m=... aplica o link, avisa e limpa o hash', async () => {
    history.replaceState(null, '', '#b=placa-mae-b650m-aorus-elite,cpu-ryzen-5-7600&m=4000')
    render(<App />)
    const socket = screen.getByRole('group', { name: 'Socket da CPU' })
    expect(within(socket).getByText('Ryzen 5 7600')).toBeInTheDocument()
    expect(screen.getByLabelText('Meta de orçamento (R$)')).toHaveValue('4.000')
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent(
      'Build do link carregada.',
    )
    await waitFor(() => expect(location.hash).toBe(''))
  })

  it('um link colado na mesma aba (hashchange) substitui a Build', async () => {
    render(<App />)
    await act(async () => {
      history.replaceState(null, '', '#b=gabinete-nzxt-h5-flow&m=7000')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(
      within(screen.getByRole('group', { name: 'Gabinete' })).getByText(/H5 Flow/),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Meta de orçamento (R$)')).toHaveValue('7.000')
    expect(location.hash).toBe('')
  })

  it('Copiar link copia a Build e avisa "Link copiado"', async () => {
    const usuario = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<App />)
    await adicionar('h5 flow')
    await usuario.click(screen.getByRole('button', { name: 'Copiar link' }))
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/#b=gabinete-nzxt-h5-flow$/))
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('Link copiado')
  })
})
