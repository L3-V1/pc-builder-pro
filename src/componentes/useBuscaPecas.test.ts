// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FILTROS_INICIAIS } from '../busca'
import type { BuscarPecas, FiltrosPesquisa } from '../busca'
import type { Peca } from '../catalogo'
import { catalogoFixture } from '../teste/catalogo'
import { useBuscaPecas } from './useBuscaPecas'

const { soCompativeis: _, ...iniciais } = FILTROS_INICIAIS
const [cpu, gpu] = [
  catalogoFixture.pecas.find((p) => p.categoria === 'cpu')!,
  catalogoFixture.pecas.find((p) => p.categoria === 'gpu')!,
]

type Chamada = {
  filtros: FiltrosPesquisa
  signal: AbortSignal
  resolver: (pecas: Peca[]) => void
  rejeitar: (erro: unknown) => void
}

// Porta espiã: cada chamada fica pendente até o teste resolvê-la ou rejeitá-la.
function portaControlada() {
  const chamadas: Chamada[] = []
  const buscar = vi.fn<BuscarPecas>(
    (filtros, signal) =>
      new Promise((resolver, rejeitar) => chamadas.push({ filtros, signal, resolver, rejeitar })),
  )
  return { buscar, chamadas }
}

function montarHook(buscar: BuscarPecas, filtros: FiltrosPesquisa = iniciais) {
  return renderHook(({ f }) => useBuscaPecas(buscar, f), { initialProps: { f: filtros } })
}

// Monta e responde a primeira busca, deixando o hook em repouso.
async function montarAssentado(buscar: BuscarPecas, chamadas: Chamada[], pecas: Peca[] = []) {
  const hook = montarHook(buscar)
  await act(() => vi.advanceTimersByTimeAsync(0))
  await act(async () => chamadas[0].resolver(pecas))
  return hook
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useBuscaPecas', () => {
  it('na montagem busca sem esperar o debounce e fica "buscando" até a resposta chegar', async () => {
    const { buscar, chamadas } = portaControlada()
    const { result } = montarHook(buscar)
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(buscar).toHaveBeenCalledTimes(1)
    expect(chamadas[0].filtros).toEqual(iniciais)
    expect(result.current.buscando).toBe(true)

    await act(async () => chamadas[0].resolver([cpu, gpu]))
    expect(result.current).toEqual({ pecas: [cpu, gpu], buscando: false, erro: false })
  })

  it('digitação rápida dispara uma única busca, com o texto final, só depois de 250 ms de pausa', async () => {
    const { buscar, chamadas } = portaControlada()
    const { rerender } = await montarAssentado(buscar, chamadas)
    buscar.mockClear()

    const texto = 'rtx 4060'
    for (let i = 1; i <= texto.length; i++) {
      rerender({ f: { ...iniciais, texto: texto.slice(0, i) } })
      await act(() => vi.advanceTimersByTimeAsync(100))
    }
    expect(buscar).not.toHaveBeenCalled()

    await act(() => vi.advanceTimersByTimeAsync(149))
    expect(buscar).not.toHaveBeenCalled()
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(buscar).toHaveBeenCalledTimes(1)
    expect(buscar.mock.calls[0][0]).toEqual({ ...iniciais, texto: 'rtx 4060' })
  })

  it('fica "buscando" no mesmo render em que o texto muda, mantendo as Peças anteriores', async () => {
    const { buscar, chamadas } = portaControlada()
    const { result, rerender } = await montarAssentado(buscar, chamadas, [cpu])
    expect(result.current.buscando).toBe(false)

    rerender({ f: { ...iniciais, texto: 'r' } })
    expect(result.current).toEqual({ pecas: [cpu], buscando: true, erro: false })
  })

  it.each<[string, Partial<FiltrosPesquisa>]>([
    ['Categoria', { categoria: 'gpu' }],
    ['ordenação', { ordenacao: 'preco-asc' }],
    ['marca', { marcas: ['AMD'] }],
    ['preço', { precoMax: 1000 }],
  ])('mudar %s busca sem esperar o debounce', async (_, mudanca) => {
    const { buscar, chamadas } = portaControlada()
    const { rerender } = await montarAssentado(buscar, chamadas)
    buscar.mockClear()

    rerender({ f: { ...iniciais, ...mudanca } })
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(buscar).toHaveBeenCalledTimes(1)
    expect(buscar.mock.calls[0][0]).toEqual({ ...iniciais, ...mudanca })
  })

  it('ao disparar uma nova busca, aborta o signal da anterior', async () => {
    const { buscar, chamadas } = portaControlada()
    const { rerender } = montarHook(buscar)
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(chamadas[0].signal.aborted).toBe(false)

    rerender({ f: { ...iniciais, categoria: 'gpu' } })
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(chamadas).toHaveLength(2)
    expect(chamadas[0].signal.aborted).toBe(true)
    expect(chamadas[1].signal.aborted).toBe(false)
  })

  it('resposta antiga que chega depois da mais recente não sobrescreve o resultado', async () => {
    const { buscar, chamadas } = portaControlada()
    const { result, rerender } = montarHook(buscar)
    await act(() => vi.advanceTimersByTimeAsync(0))
    rerender({ f: { ...iniciais, categoria: 'gpu' } })
    await act(() => vi.advanceTimersByTimeAsync(0))

    await act(async () => chamadas[1].resolver([gpu]))
    await act(async () => chamadas[0].resolver([cpu]))
    expect(result.current).toEqual({ pecas: [gpu], buscando: false, erro: false })
  })

  it('rejeição com AbortError é ignorada; outra rejeição liga "erro" e encerra o "buscando"', async () => {
    const { buscar, chamadas } = portaControlada()
    const { result, rerender } = await montarAssentado(buscar, chamadas, [cpu])

    rerender({ f: { ...iniciais, categoria: 'gpu' } })
    await act(() => vi.advanceTimersByTimeAsync(0))
    await act(async () => chamadas[1].rejeitar(new DOMException('cancelada', 'AbortError')))
    expect(result.current).toEqual({ pecas: [cpu], buscando: true, erro: false })

    rerender({ f: { ...iniciais, categoria: 'ram' } })
    await act(() => vi.advanceTimersByTimeAsync(0))
    await act(async () => chamadas[2].rejeitar(new Error('falhou')))
    expect(result.current).toMatchObject({ buscando: false, erro: true })
  })

  it('desmontar durante uma busca aborta o signal e não atualiza estado', async () => {
    const erroConsole = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { buscar, chamadas } = portaControlada()
    const { result, unmount } = montarHook(buscar)
    await act(() => vi.advanceTimersByTimeAsync(0))
    const antes = result.current

    unmount()
    expect(chamadas[0].signal.aborted).toBe(true)
    await act(async () => chamadas[0].resolver([cpu]))
    expect(result.current).toBe(antes)
    expect(erroConsole).not.toHaveBeenCalled()
    erroConsole.mockRestore()
  })

  it('em StrictMode a primeira busca também sai sem esperar o debounce', async () => {
    const { buscar } = portaControlada()
    renderHook(() => useBuscaPecas(buscar, iniciais), { reactStrictMode: true })
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(buscar).toHaveBeenCalledTimes(1)
  })
})
