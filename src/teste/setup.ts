import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  // Só existem nos testes jsdom; no ambiente node não há window.
  if (typeof window === 'undefined') return
  localStorage.clear()
  history.replaceState(null, '', location.pathname)
})
