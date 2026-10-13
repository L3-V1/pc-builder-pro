// @vitest-environment jsdom
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Aplicacao } from './Aplicacao'
import { CHAVE_ESTADO } from './persistencia'
import { catalogoFixture } from './teste/catalogo'

// Conta as chamadas à porta de busca e, quando pedido, a faz falhar; senão usa a implementação local.
const chamadasBusca = vi.hoisted(() => ({ total: 0, falhar: false }))
vi.mock('./busca/buscar', async (original) => {
  const modulo = await original<typeof import('./busca/buscar')>()
  return {
    ...modulo,
    criarBuscaLocal: (...args: Parameters<typeof modulo.criarBuscaLocal>) => {
      const buscar = modulo.criarBuscaLocal(...args)
      return (...chamada: Parameters<typeof buscar>) => {
        chamadasBusca.total++
        return chamadasBusca.falhar ? Promise.reject(new Error('falhou')) : buscar(...chamada)
      }
    },
  }
})

// A busca é assíncrona e com debounce: espera a lista assentar antes de clicar nela.
async function esperarBusca() {
  await waitFor(() =>
    expect(screen.getByTestId('contagem-busca')).not.toHaveTextContent('Buscando'),
  )
}

async function pesquisar(texto: string) {
  const buscar = screen.getByLabelText('Buscar')
  await userEvent.clear(buscar)
  await userEvent.type(buscar, texto)
  await esperarBusca()
}

async function adicionar(texto: string) {
  await pesquisar(texto)
  await userEvent.click(screen.getByRole('button', { name: /Adicionar à Build|Trocar/ }))
}

describe('Aplicacao', () => {
  it('mostra a atribuição ao BuildCores OpenDB com link e licença no rodapé', () => {
    render(<Aplicacao catalogo={catalogoFixture} />)
    const rodape = screen.getByRole('contentinfo')
    expect(within(rodape).getByRole('link', { name: 'BuildCores OpenDB' })).toHaveAttribute(
      'href',
      'https://github.com/buildcores/buildcores-open-db',
    )
    expect(within(rodape).getByRole('link', { name: 'CC BY-NC-SA 4.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    )
  })

  it('adicionar CPU sem placa-mãe a coloca na Bandeja com aviso e Orçamento zerado', async () => {
    render(<Aplicacao catalogo={catalogoFixture} />)
    await adicionar('ryzen 7600')

    const bandeja = screen.getByRole('region', { name: 'Bandeja' })
    expect(within(bandeja).getByText('Ryzen 5 7600')).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent(
      'Encaixe uma placa-mãe primeiro',
    )
    expect(screen.getByTestId('orcamento-medio')).toHaveTextContent(/R\$\s0,00/)
  })

  it('mostra estado vazio quando nada casa com a busca', async () => {
    render(<Aplicacao catalogo={catalogoFixture} />)
    await pesquisar('xyzinexistente')
    expect(screen.getByText('Nenhuma Peça encontrada')).toBeInTheDocument()
  })

  it('placa e depois CPU por clique mostram a CPU no socket e o Orçamento atualizado', async () => {
    render(<Aplicacao catalogo={catalogoFixture} />)
    await adicionar('b650m aorus')
    await adicionar('ryzen 7600')

    const socket = screen.getByRole('group', { name: 'Socket da CPU' })
    expect(within(socket).getByText('Ryzen 5 7600')).toBeInTheDocument()
    expect(screen.getByTestId('orcamento-medio')).toHaveTextContent(/R\$\s2\.150,00/)
  })

  it('trocar para placa DDR4 manda CPU e RAM para a Bandeja, sem diálogo', async () => {
    render(<Aplicacao catalogo={catalogoFixture} />)
    await adicionar('b650m aorus')
    await adicionar('ryzen 7600')
    await adicionarPorNome('vengeance 2x16', 'Vengeance 2x16 GB')
    await adicionar('b760m ds3h')

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
    render(<Aplicacao catalogo={catalogoFixture} />)
    await adicionar('b650m aorus')
    await adicionar('ryzen 7600')
    await adicionarPorNome('vengeance 2x16', 'Vengeance 2x16 GB')
    await adicionarPorNome('rtx 4060', 'GeForce RTX 4060')

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
    render(<Aplicacao catalogo={catalogoFixture} />)
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
    render(<Aplicacao catalogo={catalogoFixture} />)
    const socket = screen.getByRole('group', { name: 'Socket da CPU' })
    expect(within(socket).getByText('Ryzen 5 7600')).toBeInTheDocument()
    expect(screen.getByTestId('orcamento-medio')).toHaveTextContent(/R\$\s2\.150,00/)
    const bandeja = screen.getByRole('region', { name: 'Bandeja' })
    expect(within(bandeja).getByText('GeForce RTX 4060')).toBeInTheDocument()
    expect(screen.getByLabelText('Meta de orçamento (R$)')).toHaveValue('5.000')
  })

  it('com #b=...&m=... aplica o link, avisa e limpa o hash', async () => {
    history.replaceState(null, '', '#b=placa-mae-b650m-aorus-elite,cpu-ryzen-5-7600&m=4000')
    render(<Aplicacao catalogo={catalogoFixture} />)
    const socket = screen.getByRole('group', { name: 'Socket da CPU' })
    expect(within(socket).getByText('Ryzen 5 7600')).toBeInTheDocument()
    expect(screen.getByLabelText('Meta de orçamento (R$)')).toHaveValue('4.000')
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent(
      'Build do link carregada.',
    )
    await waitFor(() => expect(location.hash).toBe(''))
  })

  it('um link colado na mesma aba (hashchange) substitui a Build', async () => {
    render(<Aplicacao catalogo={catalogoFixture} />)
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
    render(<Aplicacao catalogo={catalogoFixture} />)
    await adicionar('h5 flow')
    await usuario.click(screen.getByRole('button', { name: 'Copiar link' }))
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/#b=gabinete-nzxt-h5-flow$/))
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('Link copiado')
  })
})

async function adicionarPorNome(busca: string, nome: string) {
  await pesquisar(busca)
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
    render(<Aplicacao catalogo={catalogoFixture} />)
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

  // Sete buscas digitadas com debounce passam dos 5 s padrão, ainda mais no runner do CI.
  it('montar a solução de Primeiro PC, ligar o PC e, ao reabrir o app, ver o Desafio concluído e a Build livre intacta', async () => {
    const { unmount } = render(<Aplicacao catalogo={catalogoFixture} />)
    await adicionar('b650m aorus')

    await abrirDesafio('Primeiro PC')
    await adicionar('h610m')
    await adicionarPorNome('12400', 'Core i5-12400')
    await adicionar('1x8')
    await adicionar('a400 240')
    await adicionar('mwe 450')
    await adicionar('cube matx')
    const painel = within(screen.getByRole('region', { name: 'Desafio: Primeiro PC' }))
    expect(painel.getByText('2 de 2 critérios')).toBeInTheDocument()
    await userEvent.click(painel.getByRole('button', { name: 'Ligar o PC' }))
    const dialogo = screen.getByRole('dialog', { name: 'Desafio concluído' })
    expect(within(dialogo).getByText('Primeiro PC')).toBeInTheDocument()
    unmount()

    render(<Aplicacao catalogo={catalogoFixture} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Desafios' }))
    const card = within(screen.getByRole('article', { name: 'Primeiro PC' }))
    expect(card.getByText('Concluído')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Montagem livre' }))
    const placa = within(screen.getByRole('group', { name: 'Placa-mãe' }))
    expect(placa.getByText(/B650M Aorus Elite/)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /^Desafio:/ })).not.toBeInTheDocument()
  }, 20_000)
})

function simularTelaPequena(pequena: boolean) {
  vi.stubGlobal('matchMedia', () => ({
    matches: pequena,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

describe('App: Escolher pelo Slot', () => {
  it('no desktop, "Escolher" num Slot filtra a busca pela Categoria e Só compatíveis', async () => {
    render(<Aplicacao catalogo={catalogoFixture} />)
    await adicionar('b650m aorus')
    await userEvent.click(screen.getByRole('button', { name: 'Escolher Peça para Slot DIMM 1' }))
    expect(screen.getByLabelText('Categoria')).toHaveDisplayValue('Memória RAM')
    expect(screen.getByLabelText('Só compatíveis')).toBeChecked()
    expect(screen.getByRole('heading', { name: 'Buscar Peças' })).toHaveFocus()
  })

  it('no celular, "Escolher" abre o painel inferior da busca já filtrado', async () => {
    simularTelaPequena(true)
    try {
      render(<Aplicacao catalogo={catalogoFixture} />)
      const barra = screen.getByRole('button', { name: 'Buscar Peças' })
      expect(barra).toHaveAttribute('aria-expanded', 'false')
      await userEvent.click(screen.getByRole('button', { name: 'Escolher Peça para Placa-mãe' }))
      expect(barra).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByLabelText('Categoria')).toHaveDisplayValue('Placa-mãe')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('no celular, "Adicionar à Build" com o painel aberto por um Slot recolhe o painel', async () => {
    simularTelaPequena(true)
    try {
      render(<Aplicacao catalogo={catalogoFixture} />)
      const barra = screen.getByRole('button', { name: 'Buscar Peças' })
      await userEvent.click(screen.getByRole('button', { name: 'Escolher Peça para Placa-mãe' }))
      await pesquisar('b650m aorus')
      await userEvent.click(screen.getByRole('button', { name: 'Adicionar à Build' }))
      expect(barra).toHaveAttribute('aria-expanded', 'false')
      expect(screen.getByRole('group', { name: 'Placa-mãe' })).toHaveTextContent(
        'B650M Aorus Elite',
      )
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('no celular, "Adicionar à Build" com o painel aberto pela barra mantém o painel aberto', async () => {
    simularTelaPequena(true)
    try {
      render(<Aplicacao catalogo={catalogoFixture} />)
      const barra = screen.getByRole('button', { name: 'Buscar Peças' })
      await userEvent.click(barra)
      await pesquisar('b650m aorus')
      await userEvent.click(screen.getByRole('button', { name: 'Adicionar à Build' }))
      expect(barra).toHaveAttribute('aria-expanded', 'true')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('no celular, começar a arrastar uma Peça da busca recolhe o painel', async () => {
    simularTelaPequena(true)
    try {
      render(<Aplicacao catalogo={catalogoFixture} />)
      const barra = screen.getByRole('button', { name: 'Buscar Peças' })
      await userEvent.click(barra)
      await pesquisar('b650m aorus')
      screen.getByRole('button', { name: 'Arrastar B650M Aorus Elite' }).focus()
      await userEvent.keyboard(' ')
      expect(barra).toHaveAttribute('aria-expanded', 'false')
      // Encerra o arraste: o sensor de teclado escuta o documento e engoliria o espaço do próximo teste.
      await userEvent.keyboard('{Escape}')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('Montagem: busca assíncrona', () => {
  const contagem = () => screen.getByTestId('contagem-busca')

  it('logo após digitar mostra "Buscando…" com a lista anterior ocupada; depois, a contagem', async () => {
    render(<Aplicacao catalogo={catalogoFixture} />)
    await waitFor(() => expect(contagem()).toHaveTextContent(/\d+ Peças encontradas/))
    const cardAnterior = screen.getAllByRole('heading', { level: 3 })[0]

    await userEvent.type(screen.getByLabelText('Buscar'), 'ryzen 7600')
    expect(contagem()).toHaveTextContent('Buscando…')
    expect(cardAnterior.closest('[aria-busy]')).toHaveAttribute('aria-busy', 'true')

    await waitFor(() => expect(contagem()).toHaveTextContent('1 Peça encontrada'))
    expect(
      screen.getByRole('heading', { name: 'Ryzen 5 7600', level: 3 }).closest('[aria-busy]'),
    ).toHaveAttribute('aria-busy', 'false')
  })

  it('"Nenhuma Peça encontrada" só aparece depois que a busca assenta, nunca durante "Buscando…"', async () => {
    render(<Aplicacao catalogo={catalogoFixture} />)
    // A primeira busca ainda não respondeu: não há lista, mas também não há "nenhuma".
    expect(contagem()).toHaveTextContent('Buscando…')
    expect(screen.queryByText('Nenhuma Peça encontrada')).not.toBeInTheDocument()
    expect(screen.getByText('Buscando Peças…')).toBeInTheDocument()

    await pesquisar('xyzinexistente')
    expect(screen.getByText('Nenhuma Peça encontrada')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Buscar'), 'z')
    expect(contagem()).toHaveTextContent('Buscando…')
    expect(screen.queryByText('Nenhuma Peça encontrada')).not.toBeInTheDocument()
    await esperarBusca()
    expect(screen.getByText('Nenhuma Peça encontrada')).toBeInTheDocument()
  })

  it('com "Só compatíveis" ligado, encaixar uma placa-mãe atualiza a lista sem nova busca', async () => {
    render(<Aplicacao catalogo={catalogoFixture} />)
    await userEvent.click(screen.getByLabelText('Só compatíveis'))
    await esperarBusca()
    expect(screen.getByRole('heading', { name: 'Core i5-12400', level: 3 })).toBeInTheDocument()
    const antes = chamadasBusca.total

    const placa = screen
      .getByRole('heading', { name: 'B650M Aorus Elite', level: 3 })
      .closest('article')
    if (!placa) throw new Error('Card da placa não encontrado')
    await userEvent.click(within(placa).getByRole('button', { name: 'Adicionar à Build' }))

    expect(contagem()).not.toHaveTextContent('Buscando')
    expect(
      screen.queryByRole('heading', { name: 'Core i5-12400', level: 3 }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ryzen 5 7600', level: 3 })).toBeInTheDocument()
    expect(chamadasBusca.total).toBe(antes)
  })

  it('quando a busca falha, mostra "Não foi possível buscar" em vez de "nenhuma"', async () => {
    chamadasBusca.falhar = true
    try {
      render(<Aplicacao catalogo={catalogoFixture} />)
      await esperarBusca()
      expect(screen.getByText('Não foi possível buscar')).toBeInTheDocument()
      expect(screen.queryByText('Nenhuma Peça encontrada')).not.toBeInTheDocument()
    } finally {
      chamadasBusca.falhar = false
    }
  })

  it('falha depois de uma busca que deu certo mostra o erro, não a lista antiga', async () => {
    render(<Aplicacao catalogo={catalogoFixture} />)
    await esperarBusca()
    chamadasBusca.falhar = true
    try {
      await pesquisar('ryzen')
      expect(screen.getByText('Não foi possível buscar')).toBeInTheDocument()
      expect(screen.queryAllByRole('heading', { name: /Ryzen/, level: 3 })).toHaveLength(0)
    } finally {
      chamadasBusca.falhar = false
    }
  })
})
