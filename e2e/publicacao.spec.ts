import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// O GitHub Pages serve o app num subcaminho (/pc-builder-pro/); com caminhos relativos o
// mesmo build funciona lá e no preview local.
test('o build referencia os assets por caminho relativo', () => {
  const html = readFileSync('dist/index.html', 'utf-8')
  const caminhos = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1])
  expect(caminhos.length).toBeGreaterThan(0)
  for (const caminho of caminhos) expect(caminho).toMatch(/^\.\//)
})
