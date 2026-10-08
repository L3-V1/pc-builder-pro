import { useSyncExternalStore } from 'react'

// Mesma régua do CSS: o layout de 3 colunas começa em min-width: 60rem.
export const CONSULTA_TELA_PEQUENA = '(max-width: 59.99rem)'

const consulta = () =>
  typeof window.matchMedia === 'function' ? window.matchMedia(CONSULTA_TELA_PEQUENA) : undefined

function assinar(avisar: () => void) {
  const midia = consulta()
  midia?.addEventListener('change', avisar)
  return () => midia?.removeEventListener('change', avisar)
}

export function useTelaPequena(): boolean {
  return useSyncExternalStore(
    assinar,
    () => consulta()?.matches ?? false,
    () => false,
  )
}
