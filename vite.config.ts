import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // Relativo: o mesmo build serve no subcaminho do GitHub Pages e no preview local.
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['src/teste/setup.ts'],
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['src/motor/**'],
      exclude: ['src/motor/**/*.test.ts', 'src/motor/teste-pecas.ts'],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
})
