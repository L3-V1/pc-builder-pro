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

describe('App: Pontuação', () => {
  it('depois de encaixar placa, CPU, RAM e GPU mostra a Pontuação dos dois Perfis', async () => {
    render(<App />)
    await adicionar('b650m aorus')
    await adicionar('ryzen 7600')
    await adicionar('vengeance 2x16')
    await adicionar('rtx 4060')

    const painel = screen.getByRole('region', { name: 'Pontuação' })
    for (const rotulo of ['Jogos', 'Produtividade']) {
      const grupo = within(within(painel).getByRole('group', { name: rotulo }))
      expect(grupo.getByText(/^\d+\/100$/)).toBeInTheDocument()
      expect(grupo.getByRole('meter', { name: `Pontuação em ${rotulo}` })).toHaveAttribute(
        'aria-valuenow',
      )
    }
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

async function adicionarPorNome(busca: string, nome: string) {
  const buscar = screen.getByLabelText('Buscar')
  await userEvent.clear(buscar)
  await userEvent.type(buscar, busca)
  const card = screen.getByRole('heading', { name: nome, level: 3 }).closest('article')
  if (!card) throw new Error(`Card de "${nome}" não encontrado`)
  await userEvent.click(within(card).getByRole('button', { name: /Adicionar à Build|Trocar/ }))
}

async function abrirDesafio(titulo: string) {
  await userEvent.click(screen.getByRole('tab', { name: 'Desafios' }))
  const card = screen.getByRole('article', { name: titulo })
  await userEvent.click(within(card).getByRole('button', { name: /Iniciar|Continuar/ }))
}

describe('App: Desafios', () => {
  it('a aba Desafios lista os Desafios e iniciar um mostra o painel, a Meta travada e nenhum Copiar link', async () => {
    render(<App />)
    expect(screen.getByRole('tab', { name: 'Montagem livre' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await userEvent.click(screen.getByRole('tab', { name: 'Desafios' }))
    expect(screen.getByRole('tab', { name: 'Desafios' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('article', { name: 'Primeiro PC' })).toBeInTheDocument()

    await abrirDesafio('Primeiro PC')
    expect(screen.getByRole('region', { name: 'Desafio: Primeiro PC' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Desafios' })).toHaveAttribute('aria-selected', 'true')
    const meta = screen.getByLabelText('Meta do Desafio (R$)')
    expect(meta).toHaveValue('3.000')
    expect(meta).toHaveAttribute('readonly')
    expect(screen.queryByRole('button', { name: 'Copiar link' })).not.toBeInTheDocument()
  })

  it('montar a solução de Primeiro PC, ligar o PC e, ao reabrir o app, ver o Desafio concluído e a Build livre intacta', async () => {
    const { unmount } = render(<App />)
    await adicionar('b650m aorus')

    await abrirDesafio('Primeiro PC')
    await adicionar('b760m')
    await adicionarPorNome('12400', 'Core i5-12400')
    await adicionar('vengeance lpx')
    await adicionar('a400')
    await adicionar('mwe 450')
    await adicionar('cube matx')
    const painel = within(screen.getByRole('region', { name: 'Desafio: Primeiro PC' }))
    expect(painel.getByText('2 de 2 critérios')).toBeInTheDocument()
    await userEvent.click(painel.getByRole('button', { name: 'Ligar o PC' }))
    const dialogo = screen.getByRole('dialog', { name: 'Desafio concluído' })
    expect(within(dialogo).getByText('Primeiro PC')).toBeInTheDocument()
    unmount()

    render(<App />)
    await userEvent.click(screen.getByRole('tab', { name: 'Desafios' }))
    const card = within(screen.getByRole('article', { name: 'Primeiro PC' }))
    expect(card.getByText('Concluído')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Montagem livre' }))
    const placa = within(screen.getByRole('group', { name: 'Placa-mãe' }))
    expect(placa.getByText(/B650M Aorus Elite/)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /^Desafio:/ })).not.toBeInTheDocument()
  })
})
