// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CONSULTA_TELA_PEQUENA, useTelaPequena } from './useTelaPequena'

function simularMidia(inicial: boolean) {
  const ouvintes = new Set<(e: { matches: boolean }) => void>()
  const consulta = {
    matches: inicial,
    addEventListener: (_: string, f: (e: { matches: boolean }) => void) => ouvintes.add(f),
    removeEventListener: (_: string, f: (e: { matches: boolean }) => void) => ouvintes.delete(f),
  }
  const matchMedia = vi.fn(() => consulta)
  vi.stubGlobal('matchMedia', matchMedia)
  return {
    matchMedia,
    mudar(matches: boolean) {
      consulta.matches = matches
      for (const f of ouvintes) f({ matches })
    },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useTelaPequena', () => {
  it('devolve false quando não há matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(renderHook(() => useTelaPequena()).result.current).toBe(false)
  })

  it('segue a media query do breakpoint e reage quando ela muda', () => {
    const midia = simularMidia(true)
    const { result } = renderHook(() => useTelaPequena())
    expect(midia.matchMedia).toHaveBeenCalledWith(CONSULTA_TELA_PEQUENA)
    expect(result.current).toBe(true)
    act(() => midia.mudar(false))
    expect(result.current).toBe(false)
  })
})
